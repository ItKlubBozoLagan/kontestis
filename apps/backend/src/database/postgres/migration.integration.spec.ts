/* eslint-env jest */

import { Repositories } from "../../repositories/Repositories";
import { Database } from "../Database";
import { tableNames } from "./tables";

const describeSnapshot = process.env.TEST_PRODUCTION_SNAPSHOT === "true" ? describe : describe.skip;

describeSnapshot("production snapshot migration", () => {
    beforeAll(() => Database.awaitConnection());
    afterAll(() => Database.shutdown());

    it("has a completed migration marker for the final Scyllo schema", async () => {
        const result = await Database.raw(
            "SELECT status, source_schema_version FROM scylla_migration WHERE migration_key=1"
        );

        expect(result.rows).toEqual([{ status: "complete", source_schema_version: 53 }]);
    });

    it("verified every business table by count and canonical digest", async () => {
        const result = await Database.raw(
            `SELECT table_name, source_rows, target_rows, source_digest, target_digest
             FROM scylla_migration_tables WHERE status='complete' ORDER BY table_name`
        );

        expect(result.rows).toHaveLength(tableNames.length);

        for (const row of result.rows) {
            expect(row.source_rows).toBe(row.target_rows);
            expect(row.source_digest).toBe(row.target_digest);
        }
    });

    it("round-trips normalized tags and score maps through legacy model shapes", async () => {
        const problemResult = await Database.raw(
            "SELECT problem_id, COUNT(*)::bigint AS count FROM problem_tags GROUP BY problem_id LIMIT 1"
        );

        if (problemResult.rows.length > 0) {
            const problem = await Database.selectOneFrom("problems", "*", {
                id: problemResult.rows[0].problem_id,
            });

            expect(problem?.tags).toHaveLength(Number(problemResult.rows[0].count));
        }

        const memberResult = await Database.raw(
            "SELECT contest_member_id, contest_id, user_id, COUNT(*)::bigint AS count FROM contest_member_scores GROUP BY contest_member_id, contest_id, user_id LIMIT 1"
        );

        if (memberResult.rows.length > 0) {
            const member = await Database.selectOneFrom("contest_members", "*", {
                id: memberResult.rows[0].contest_member_id,
                contest_id: memberResult.rows[0].contest_id,
                user_id: memberResult.rows[0].user_id,
            });

            expect(Object.keys(member?.score ?? {})).toHaveLength(
                Number(memberResult.rows[0].count)
            );
        }
    });

    it("preserves legacy composite identities without collapsing rows", async () => {
        for (const table of [
            "contest_members",
            "organisation_members",
            "exam_final_submissions",
        ] as const) {
            const count = await Database.count(table);
            const audit = await Database.rawWithParams(
                "SELECT target_rows FROM scylla_migration_tables WHERE table_name=$1",
                [table]
            );

            expect(count).toBe(audit.rows[0].target_rows);
        }
    });

    it("serves joined read models directly from the migrated snapshot", async () => {
        const contestResult = await Database.raw<{
            contest_id: bigint;
            organisation_id: bigint;
        }>(
            `SELECT members.contest_id, contests.organisation_id
             FROM contest_members members
             JOIN contests ON contests.id = members.contest_id
             WHERE contests.organisation_id IS NOT NULL
             GROUP BY members.contest_id, contests.organisation_id
             ORDER BY COUNT(*) DESC
             LIMIT 1`
        );
        const [{ contest_id: contestId, organisation_id: organisationId }] = contestResult.rows;
        const leaderboard = await Repositories.contest_members.selectLeaderboard(
            contestId,
            organisationId
        );
        const memberCount = await Database.count("contest_members", { contest_id: contestId });

        expect(BigInt(leaderboard.length)).toBe(memberCount);
        expect(leaderboard.every((member) => member.user_full_name !== null)).toBe(true);

        const participants = await Repositories.contest_members.selectEloParticipants(
            contestId,
            organisationId,
            1000
        );
        const expectedParticipants = await Database.rawWithParams<{ count: bigint }>(
            `SELECT COUNT(*)::bigint AS count
             FROM contest_members members
             JOIN users ON users.id = members.user_id
             WHERE members.contest_id = $1
               AND EXISTS (
                   SELECT 1 FROM organisation_members organisation_member
                   WHERE organisation_member.organisation_id = $2
                     AND organisation_member.user_id = members.user_id
               )`,
            [contestId, organisationId]
        );

        expect(BigInt(participants.length)).toBe(expectedParticipants.rows[0].count);

        const problems = await Repositories.problems.selectWithTotalPoints(contestId);
        const expectedProblemPoints = await Database.rawWithParams<{
            id: bigint;
            total_points: number;
        }>(
            `SELECT problems.id, COALESCE(SUM(clusters.awarded_score), 0)::integer AS total_points
             FROM problems
             LEFT JOIN clusters ON clusters.problem_id = problems.id
             WHERE problems.contest_id = $1
             GROUP BY problems.id`,
            [contestId]
        );

        expect(new Map(problems.map((problem) => [problem.id, problem.total_points]))).toEqual(
            new Map(expectedProblemPoints.rows.map((problem) => [problem.id, problem.total_points]))
        );
    });

    it("joins organisation members and submissions without fan-out queries", async () => {
        const organisationResult = await Database.raw<{ organisation_id: bigint }>(
            `SELECT organisation_id
             FROM organisation_members
             GROUP BY organisation_id
             ORDER BY COUNT(*) DESC
             LIMIT 1`
        );
        const organisationId = organisationResult.rows[0].organisation_id;
        const members = await Repositories.organisation_members.selectWithUserInfo(organisationId);
        const expectedMembers = await Database.rawWithParams<{ count: bigint }>(
            `SELECT COUNT(*)::bigint AS count
             FROM organisation_members members
             JOIN users ON users.id = members.user_id
             WHERE members.organisation_id = $1`,
            [organisationId]
        );

        expect(BigInt(members.length)).toBe(expectedMembers.rows[0].count);
        expect(members.every((member) => member.full_name && member.email_domain)).toBe(true);

        const problemResult = await Database.raw<{ problem_id: bigint }>(
            `SELECT problem_id
             FROM submissions
             GROUP BY problem_id
             ORDER BY COUNT(*) DESC
             LIMIT 1`
        );
        const problemId = problemResult.rows[0].problem_id;
        const submissions = await Repositories.submissions.selectWithUserInfoByProblem(problemId);
        const expectedSubmissions = await Database.rawWithParams<{ count: bigint }>(
            `SELECT COUNT(*)::bigint AS count
             FROM submissions
             JOIN users ON users.id = submissions.user_id
             WHERE submissions.problem_id = $1`,
            [problemId]
        );

        expect(BigInt(submissions.length)).toBe(expectedSubmissions.rows[0].count);
        expect(submissions.every((submission) => submission.full_name)).toBe(true);
    });

    it("joins chat authors and final-submission problem IDs in one read", async () => {
        const threadResult = await Database.raw<{ thread_id: bigint; count: bigint }>(
            `SELECT thread_id, COUNT(*)::bigint AS count
             FROM contest_chat_messages
             GROUP BY thread_id
             ORDER BY COUNT(*) DESC
             LIMIT 1`
        );

        if (threadResult.rows.length > 0) {
            const messages = await Repositories.contest_chat_messages.selectWithAuthorByThread(
                threadResult.rows[0].thread_id
            );

            expect(BigInt(messages.length)).toBe(threadResult.rows[0].count);
            expect(messages).toEqual(
                [...messages].sort((left, right) => (left.id < right.id ? -1 : 1))
            );
        }

        const finalSubmissionResult = await Database.raw<{
            contest_id: bigint;
            user_id: bigint;
            count: bigint;
        }>(
            `SELECT contest_id, user_id, COUNT(*)::bigint AS count
             FROM exam_final_submissions
             GROUP BY contest_id, user_id
             ORDER BY COUNT(*) DESC
             LIMIT 1`
        );

        if (finalSubmissionResult.rows.length > 0) {
            const [{ contest_id: contestId, user_id: userId, count }] = finalSubmissionResult.rows;
            const finalSubmissions = await Repositories.exam_final_submissions.selectWithProblemIds(
                contestId,
                userId
            );

            expect(BigInt(finalSubmissions.length)).toBe(count);

            const firstWithProblem = finalSubmissions.find(
                (finalSubmission) => finalSubmission.problem_id !== 0n
            );

            if (firstWithProblem) {
                const existing = await Repositories.exam_final_submissions.selectForProblem(
                    contestId,
                    userId,
                    firstWithProblem.problem_id
                );

                expect(existing?.submission_id).toBe(firstWithProblem.submission_id);
            }
        }
    });
});
