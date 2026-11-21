/* eslint-disable no-dupe-class-members, sonarjs/no-all-duplicated-branches */

import {
    AdminContestListItem,
    AdminUserListItem,
    ClusterSubmissionDetails,
    OrganisationOverview,
    ProblemSummary,
} from "@kontestis/models";
import { PoolClient } from "pg";
import { QueryResultRow } from "pg";

import { Database } from "../database/Database";
import { Criteria, Runner } from "../database/postgres/PostgresDatabase";
import { KontestisTables, TableName } from "../database/postgres/tables";

type TableRow<Table extends TableName> = KontestisTables[Table];

export type ContestWithMembership = KontestisTables["contests"] & {
    member_contest_permissions: KontestisTables["contest_members"]["contest_permissions"] | null;
};

export type ContestLeaderboardRow = KontestisTables["contest_members"] & {
    user_full_name: string | null;
    user_email: string | null;
    user_permissions: KontestisTables["users"]["permissions"] | null;
    edu_full_name: string | null;
    edu_email: string | null;
    organisation_elo: number | null;
};

export type EloParticipant = KontestisTables["contest_members"] & {
    organisation_member_id: bigint;
    organisation_elo: number;
};

export type OrganisationMemberWithUserInfo = KontestisTables["organisation_members"] & {
    full_name: string;
    email_domain: string;
};

type SubmissionListColumn =
    | "id"
    | "user_id"
    | "problem_id"
    | "language"
    | "created_at"
    | "time_used_millis"
    | "memory_used_megabytes"
    | "verdict"
    | "awarded_score"
    | "samples_passed";

export type SubmissionWithUserInfo = Pick<KontestisTables["submissions"], SubmissionListColumn> & {
    full_name: string;
};

export type ProblemWithTotalPoints = Omit<KontestisTables["problems"], "tags"> & {
    total_points: number;
};

export type ContestChatMessageWithAuthor = KontestisTables["contest_chat_messages"] & {
    author_name: string | null;
};

export type ExamFinalSubmissionWithProblemId = KontestisTables["exam_final_submissions"] & {
    problem_id: bigint;
};

export class TableRepository<Table extends TableName> {
    constructor(protected readonly table: Table, protected readonly runner?: Runner) {}

    select(fields: "*", criteria?: Criteria<TableRow<Table>>): Promise<TableRow<Table>[]>;
    select<Column extends keyof TableRow<Table>>(
        fields: readonly Column[],
        criteria?: Criteria<TableRow<Table>>
    ): Promise<Pick<TableRow<Table>, Column>[]>;
    select<Column extends keyof TableRow<Table>>(
        fields: "*" | readonly Column[],
        criteria?: Criteria<TableRow<Table>>
    ) {
        return fields === "*"
            ? Database.selectFrom(this.table, fields, criteria, this.runner)
            : Database.selectFrom(this.table, fields, criteria, this.runner);
    }

    selectOne(
        fields: "*",
        criteria?: Criteria<TableRow<Table>>
    ): Promise<TableRow<Table> | undefined>;
    selectOne<Column extends keyof TableRow<Table>>(
        fields: readonly Column[],
        criteria?: Criteria<TableRow<Table>>
    ): Promise<Pick<TableRow<Table>, Column> | undefined>;
    selectOne<Column extends keyof TableRow<Table>>(
        fields: "*" | readonly Column[],
        criteria?: Criteria<TableRow<Table>>
    ) {
        return fields === "*"
            ? Database.selectOneFrom(this.table, fields, criteria, this.runner)
            : Database.selectOneFrom(this.table, fields, criteria, this.runner);
    }

    count(criteria?: Criteria<KontestisTables[Table]>) {
        return Database.count(this.table, criteria, this.runner);
    }

    insert(object: Partial<KontestisTables[Table]>) {
        return Database.insertInto(this.table, object, this.runner);
    }

    update(object: Partial<KontestisTables[Table]>, criteria: Criteria<KontestisTables[Table]>) {
        return Database.update(this.table, object, criteria, this.runner);
    }

    delete<Column extends keyof KontestisTables[Table]>(
        fields: "*" | Column[],
        criteria: Criteria<KontestisTables[Table]>
    ) {
        return Database.deleteFrom(this.table, fields, criteria, this.runner);
    }

    protected async query<Row extends QueryResultRow>(
        sql: string,
        parameters: readonly unknown[] = []
    ): Promise<Row[]> {
        const result = await (this.runner ?? Database.pool).query<Row>(sql, [...parameters]);

        return result.rows;
    }
}

export type UserSearchOptions = {
    search?: string;
    limit: number;
    offset: number;
    sort: "name" | "email" | "newest";
};

class UserRepository extends TableRepository<"users"> {
    constructor(runner?: Runner) {
        super("users", runner);
    }

    async search(
        options: UserSearchOptions
    ): Promise<{ items: AdminUserListItem[]; total: number }> {
        const order =
            options.sort === "email"
                ? "users.email ASC"
                : options.sort === "newest"
                ? "users.id DESC"
                : "users.full_name ASC";
        const pattern = options.search ? `%${options.search.replace(/[%\\_]/g, "\\$&")}%` : null;

        const rows = await this.query<AdminUserListItem & { total: number }>(
            `SELECT users.*,
                    EXISTS (SELECT 1 FROM managed_users WHERE managed_users.id = users.id) AS is_managed,
                    EXISTS (SELECT 1 FROM edu_users WHERE edu_users.id = users.id) AS is_edu,
                    EXISTS (SELECT 1 FROM temporary_users WHERE temporary_users.id = users.id) AS is_temporary,
                    (SELECT COUNT(*) FROM organisation_members members
                      WHERE members.user_id = users.id)::integer AS organisation_count,
                    (SELECT COUNT(*) FROM submissions
                      WHERE submissions.user_id = users.id)::integer AS submission_count,
                    COUNT(*) OVER ()::integer AS total
             FROM users
             WHERE $1::text IS NULL
                OR users.full_name ILIKE $1
                OR users.email ILIKE $1
                OR users.id::text = $2
             ORDER BY ${order}, users.id
             LIMIT $3 OFFSET $4`,
            [pattern, options.search ?? null, options.limit, options.offset]
        );

        if (rows.length === 0 && options.offset > 0) {
            const [{ count }] = await this.query<{ count: number }>(
                `SELECT COUNT(*)::integer AS count FROM users
                 WHERE $1::text IS NULL OR users.full_name ILIKE $1 OR users.email ILIKE $1 OR users.id::text = $2`,
                [pattern, options.search ?? null]
            );

            return { items: [], total: count };
        }

        return {
            items: rows.map(({ total: _, ...user }) => user),
            total: rows[0]?.total ?? 0,
        };
    }
}

class ContestMemberRepository extends TableRepository<"contest_members"> {
    constructor(runner?: Runner) {
        super("contest_members", runner);
    }

    setScore(
        member: Pick<KontestisTables["contest_members"], "id" | "contest_id" | "user_id">,
        map: "score" | "exam_score",
        problemId: bigint,
        score: number
    ) {
        return Database.setMapEntry(member, map, problemId, score, this.runner);
    }

    selectLeaderboard(contestId: bigint, organisationId: bigint): Promise<ContestLeaderboardRow[]> {
        return this.query(
            `SELECT cm.*,
                    u.full_name AS user_full_name,
                    u.email AS user_email,
                    u.permissions AS user_permissions,
                    eu.full_name AS edu_full_name,
                    eu.email AS edu_email,
                    organisation_member.elo AS organisation_elo,
                    COALESCE((
                        SELECT jsonb_object_agg(scores.problem_id::text, scores.score)
                        FROM contest_member_scores scores
                        WHERE (scores.contest_member_id, scores.contest_id, scores.user_id) =
                              (cm.id, cm.contest_id, cm.user_id)
                    ), '{}'::jsonb) AS score,
                    COALESCE((
                        SELECT jsonb_object_agg(scores.problem_id::text, scores.score)
                        FROM contest_member_exam_scores scores
                        WHERE (scores.contest_member_id, scores.contest_id, scores.user_id) =
                              (cm.id, cm.contest_id, cm.user_id)
                    ), '{}'::jsonb) AS exam_score
             FROM contest_members cm
             LEFT JOIN users u ON u.id = cm.user_id
             LEFT JOIN edu_users eu ON eu.id = cm.user_id
             LEFT JOIN LATERAL (
                 SELECT members.elo
                 FROM organisation_members members
                 WHERE members.organisation_id = $2 AND members.user_id = cm.user_id
                 ORDER BY members.id
                 LIMIT 1
             ) organisation_member ON true
             WHERE cm.contest_id = $1`,
            [contestId, organisationId]
        );
    }

    selectEloParticipants(
        contestId: bigint,
        organisationId: bigint,
        defaultElo: number
    ): Promise<EloParticipant[]> {
        return this.query(
            `SELECT cm.*,
                    organisation_member.id AS organisation_member_id,
                    COALESCE(organisation_member.elo, $3) AS organisation_elo,
                    COALESCE((
                        SELECT jsonb_object_agg(scores.problem_id::text, scores.score)
                        FROM contest_member_scores scores
                        WHERE (scores.contest_member_id, scores.contest_id, scores.user_id) =
                              (cm.id, cm.contest_id, cm.user_id)
                    ), '{}'::jsonb) AS score,
                    COALESCE((
                        SELECT jsonb_object_agg(scores.problem_id::text, scores.score)
                        FROM contest_member_exam_scores scores
                        WHERE (scores.contest_member_id, scores.contest_id, scores.user_id) =
                              (cm.id, cm.contest_id, cm.user_id)
                    ), '{}'::jsonb) AS exam_score
             FROM contest_members cm
             JOIN users u ON u.id = cm.user_id
             JOIN LATERAL (
                 SELECT members.id, members.elo
                 FROM organisation_members members
                 WHERE members.organisation_id = $2 AND members.user_id = cm.user_id
                 ORDER BY members.id
                 LIMIT 1
             ) organisation_member ON true
             WHERE cm.contest_id = $1`,
            [contestId, organisationId, defaultElo]
        );
    }
}

class ContestRepository extends TableRepository<"contests"> {
    constructor(runner?: Runner) {
        super("contests", runner);
    }

    selectForOrganisationWithMembership(
        organisationId: bigint,
        userId?: bigint
    ): Promise<ContestWithMembership[]> {
        return this.query(
            `SELECT contests.*, membership.contest_permissions AS member_contest_permissions
             FROM contests
             LEFT JOIN LATERAL (
                 SELECT members.contest_permissions
                 FROM contest_members members
                 WHERE members.contest_id = contests.id AND members.user_id = $2
                 ORDER BY members.id
                 LIMIT 1
             ) membership ON $2::bigint IS NOT NULL
             WHERE contests.organisation_id = $1`,
            [organisationId, userId ?? null]
        );
    }

    selectAllWithStats(): Promise<AdminContestListItem[]> {
        return this.query(
            `SELECT contests.*,
                    COALESCE(organisations.name, '') AS organisation_name,
                    (SELECT COUNT(*) FROM contest_members WHERE contest_members.contest_id = contests.id)::integer AS member_count,
                    (SELECT COUNT(*) FROM problems WHERE problems.contest_id = contests.id)::integer AS problem_count
             FROM contests
             LEFT JOIN organisations ON organisations.id = contests.organisation_id
             ORDER BY contests.start_time DESC`
        );
    }

    selectForTemporaryUser(userId: bigint): Promise<ContestWithMembership[]> {
        return this.query(
            `SELECT contests.*, members.contest_permissions AS member_contest_permissions
             FROM contest_members members
             JOIN contests ON contests.id = members.contest_id
             WHERE members.user_id = $1`,
            [userId]
        );
    }
}

class OrganisationRepository extends TableRepository<"organisations"> {
    constructor(runner?: Runner) {
        super("organisations", runner);
    }

    selectForUser(userId: bigint): Promise<KontestisTables["organisations"][]> {
        return this.query(
            `SELECT organisations.*
             FROM organisations
             WHERE EXISTS (
                 SELECT 1
                 FROM organisation_members members
                 WHERE members.organisation_id = organisations.id AND members.user_id = $1
             )`,
            [userId]
        );
    }
}

class OrganisationOverviewRepository {
    selectOverview(): Promise<OrganisationOverview[]> {
        return Database.pool
            .query<OrganisationOverview>(
                `SELECT organisations.*,
                        owner.full_name AS owner_name,
                        (SELECT COUNT(*) FROM organisation_members members
                          WHERE members.organisation_id = organisations.id)::integer AS member_count,
                        (SELECT COUNT(*) FROM contests
                          WHERE contests.organisation_id = organisations.id)::integer AS contest_count
                 FROM organisations
                 LEFT JOIN users owner ON owner.id = organisations.owner
                 ORDER BY organisations.id`
            )
            .then((result) => result.rows);
    }
}

export const OrganisationOverviews = new OrganisationOverviewRepository();

class OrganisationMemberRepository extends TableRepository<"organisation_members"> {
    constructor(runner?: Runner) {
        super("organisation_members", runner);
    }

    selectWithUserInfo(organisationId: bigint): Promise<OrganisationMemberWithUserInfo[]> {
        return this.query(
            `SELECT members.*,
                    users.full_name,
                    regexp_replace(users.email, '^.*@', '') AS email_domain
             FROM organisation_members members
             JOIN users ON users.id = members.user_id
             WHERE members.organisation_id = $1`,
            [organisationId]
        );
    }
}

class SubmissionRepository extends TableRepository<"submissions"> {
    constructor(runner?: Runner) {
        super("submissions", runner);
    }

    selectWithUserInfoByProblem(problemId: bigint): Promise<SubmissionWithUserInfo[]> {
        return this.query(
            `SELECT submissions.id,
                    submissions.user_id,
                    submissions.problem_id,
                    submissions.language,
                    submissions.created_at,
                    submissions.time_used_millis,
                    submissions.memory_used_megabytes,
                    submissions.verdict,
                    submissions.awarded_score,
                    submissions.samples_passed,
                    users.full_name
             FROM submissions
             JOIN users ON users.id = submissions.user_id
             WHERE submissions.problem_id = $1`,
            [problemId]
        );
    }

    async countForUser(
        userId: bigint,
        problemIds: bigint[]
    ): Promise<{ submissions: number; accepted_submissions: number; solved_problems: number }> {
        const [result] = await this.query<{
            submissions: number;
            accepted_submissions: number;
            solved_problems: number;
        }>(
            `SELECT COUNT(*)::integer AS submissions,
                    COUNT(*) FILTER (WHERE submissions.verdict = 'accepted')::integer AS accepted_submissions,
                    COUNT(DISTINCT submissions.problem_id)
                        FILTER (WHERE submissions.verdict = 'accepted')::integer AS solved_problems
             FROM submissions
             WHERE submissions.user_id = $1 AND submissions.problem_id = ANY($2::bigint[])`,
            [userId, problemIds]
        );

        return result;
    }

    /** Cluster results of a submission with their testcase results nested, ordered like the problem. */
    selectDetails(submissionId: bigint): Promise<ClusterSubmissionDetails[]> {
        return this.query<ClusterSubmissionDetails>(
            `SELECT cluster_submissions.*,
                    COALESCE(clusters.order_number, 0) AS order_number,
                    COALESCE(clusters.is_sample, false) AS is_sample,
                    COALESCE(clusters.awarded_score, 0)::integer AS max_score,
                    COALESCE((
                        SELECT jsonb_agg(
                                   jsonb_build_object(
                                       'id', testcase_submissions.id::text,
                                       'testcase_id', testcase_submissions.testcase_id::text,
                                       'cluster_submission_id', testcase_submissions.cluster_submission_id::text,
                                       'verdict', testcase_submissions.verdict,
                                       'awarded_score', testcase_submissions.awarded_score,
                                       'time_used_millis', testcase_submissions.time_used_millis,
                                       'memory_used_megabytes', testcase_submissions.memory_used_megabytes
                                   )
                                   ORDER BY testcase_submissions.testcase_id
                               )
                        FROM testcase_submissions
                        WHERE testcase_submissions.cluster_submission_id = cluster_submissions.id
                    ), '[]'::jsonb) AS testcases
             FROM cluster_submissions
             LEFT JOIN clusters ON clusters.id = cluster_submissions.cluster_id
             WHERE cluster_submissions.submission_id = $1
             ORDER BY clusters.order_number NULLS LAST, cluster_submissions.cluster_id`,
            [submissionId]
        ).then((rows) =>
            rows.map(
                (row): ClusterSubmissionDetails => ({
                    ...row,
                    order_number: BigInt(row.order_number),
                    testcases: (row.testcases as unknown as Record<string, unknown>[]).map(
                        (it) => ({
                            ...it,
                            id: BigInt(it.id as string),
                            testcase_id: BigInt(it.testcase_id as string),
                            cluster_submission_id: BigInt(it.cluster_submission_id as string),
                        })
                    ) as ClusterSubmissionDetails["testcases"],
                })
            )
        );
    }
}

class ProblemRepository extends TableRepository<"problems"> {
    constructor(runner?: Runner) {
        super("problems", runner);
    }

    selectWithTotalPoints(contestId: bigint): Promise<ProblemWithTotalPoints[]> {
        return this.query(
            `SELECT problems.*,
                    COALESCE(SUM(clusters.awarded_score), 0)::integer AS total_points
             FROM problems
             LEFT JOIN clusters ON clusters.problem_id = problems.id
             WHERE problems.contest_id = $1
             GROUP BY problems.id`,
            [contestId]
        );
    }

    /** All problems of a contest with tags and total points, in one round-trip. */
    selectForContestWithScore(
        contestId: bigint
    ): Promise<(KontestisTables["problems"] & { score: number })[]> {
        return this.query(
            `SELECT problems.*,
                    COALESCE(points.total, 0)::integer AS score,
                    COALESCE(tags.tags, ARRAY[]::text[]) AS tags
             FROM problems
             LEFT JOIN LATERAL (
                 SELECT SUM(clusters.awarded_score) AS total
                 FROM clusters
                 WHERE clusters.problem_id = problems.id
             ) points ON true
             LEFT JOIN LATERAL (
                 SELECT array_agg(problem_tags.tag ORDER BY problem_tags.tag) AS tags
                 FROM problem_tags
                 WHERE problem_tags.problem_id = problems.id
             ) tags ON true
             WHERE problems.contest_id = $1
             ORDER BY problems.id`,
            [contestId]
        );
    }

    /** Lightweight problem rows for listing pages, joined with contest data and the user's best score. */
    selectSummaries(contestIds: bigint[], userId: bigint): Promise<ProblemSummary[]> {
        if (contestIds.length === 0) return Promise.resolve([]);

        return this.query(
            `SELECT problems.id,
                    problems.contest_id,
                    problems.title,
                    problems.evaluation_variant,
                    problems.time_limit_millis,
                    problems.memory_limit_megabytes,
                    contests.name AS contest_name,
                    contests.start_time AS contest_start_time,
                    contests.duration_seconds AS contest_duration_seconds,
                    COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
                    COALESCE(points.total, 0)::integer AS score,
                    attempts.best_score,
                    COALESCE(attempts.attempts, 0)::integer AS attempts
             FROM problems
             JOIN contests ON contests.id = problems.contest_id
             LEFT JOIN LATERAL (
                 SELECT SUM(clusters.awarded_score) AS total
                 FROM clusters
                 WHERE clusters.problem_id = problems.id
             ) points ON true
             LEFT JOIN LATERAL (
                 SELECT array_agg(problem_tags.tag ORDER BY problem_tags.tag) AS tags
                 FROM problem_tags
                 WHERE problem_tags.problem_id = problems.id
             ) tags ON true
             LEFT JOIN LATERAL (
                 SELECT MAX(submissions.awarded_score)::integer AS best_score,
                        COUNT(*) AS attempts
                 FROM submissions
                 WHERE submissions.problem_id = problems.id AND submissions.user_id = $2
             ) attempts ON true
             WHERE problems.contest_id = ANY($1::bigint[])
             ORDER BY contests.start_time DESC, problems.id`,
            [contestIds, userId]
        );
    }
}

class ContestChatMessageRepository extends TableRepository<"contest_chat_messages"> {
    constructor(runner?: Runner) {
        super("contest_chat_messages", runner);
    }

    selectWithAuthorByThread(threadId: bigint): Promise<ContestChatMessageWithAuthor[]> {
        return this.query(
            `SELECT messages.*, users.full_name AS author_name
             FROM contest_chat_messages messages
             LEFT JOIN LATERAL (
                 SELECT members.user_id
                 FROM contest_members members
                 WHERE members.id = messages.author_member_id
                   AND members.contest_id = messages.contest_id
                 ORDER BY members.user_id
                 LIMIT 1
             ) author_member ON true
             LEFT JOIN users
                    ON users.id = COALESCE(author_member.user_id, messages.author_member_id)
             WHERE messages.thread_id = $1
             ORDER BY messages.id`,
            [threadId]
        );
    }
}

class ExamFinalSubmissionRepository extends TableRepository<"exam_final_submissions"> {
    constructor(runner?: Runner) {
        super("exam_final_submissions", runner);
    }

    async selectForProblem(
        contestId: bigint,
        userId: bigint,
        problemId: bigint
    ): Promise<KontestisTables["exam_final_submissions"] | undefined> {
        const [result] = await this.query<KontestisTables["exam_final_submissions"]>(
            `SELECT final_submissions.*
             FROM exam_final_submissions final_submissions
             JOIN submissions ON submissions.id = final_submissions.submission_id
             WHERE final_submissions.contest_id = $1
               AND final_submissions.user_id = $2
               AND submissions.problem_id = $3
             ORDER BY final_submissions.id
             LIMIT 1`,
            [contestId, userId, problemId]
        );

        return result;
    }

    selectWithProblemIds(
        contestId: bigint,
        userId: bigint
    ): Promise<ExamFinalSubmissionWithProblemId[]> {
        return this.query(
            `SELECT final_submissions.*,
                    COALESCE(submissions.problem_id, 0::bigint) AS problem_id
             FROM exam_final_submissions final_submissions
             LEFT JOIN submissions ON submissions.id = final_submissions.submission_id
             WHERE final_submissions.contest_id = $1
               AND final_submissions.user_id = $2`,
            [contestId, userId]
        );
    }

    /** Every final submission of a contest (all participants) in one query. */
    selectForContest(contestId: bigint): Promise<ExamFinalSubmissionWithProblemId[]> {
        return this.query(
            `SELECT final_submissions.*,
                    COALESCE(submissions.problem_id, 0::bigint) AS problem_id
             FROM exam_final_submissions final_submissions
             LEFT JOIN submissions ON submissions.id = final_submissions.submission_id
             WHERE final_submissions.contest_id = $1`,
            [contestId]
        );
    }
}

class NotificationRepository extends TableRepository<"notifications"> {
    constructor(runner?: Runner) {
        super("notifications", runner);
    }

    /** Already published notifications of a user since `since`, newest first. */
    selectRecent(recipient: bigint, since: Date): Promise<KontestisTables["notifications"][]> {
        return this.query(
            `SELECT *
             FROM notifications
             WHERE recipient = $1 AND created_at >= $2 AND created_at <= now()
             ORDER BY created_at DESC`,
            [recipient, since]
        );
    }
}

export class RepositoryRegistry {
    readonly users: UserRepository;
    readonly contests: ContestRepository;
    readonly problems: ProblemRepository;
    readonly clusters: TableRepository<"clusters">;
    readonly testcases: TableRepository<"testcases">;
    readonly submissions: SubmissionRepository;
    readonly cluster_submissions: TableRepository<"cluster_submissions">;
    readonly testcase_submissions: TableRepository<"testcase_submissions">;
    readonly contest_members: ContestMemberRepository;
    readonly contest_questions: TableRepository<"contest_questions">;
    readonly contest_chat_messages: ContestChatMessageRepository;
    readonly contest_announcements: TableRepository<"contest_announcements">;
    readonly organisations: OrganisationRepository;
    readonly organisation_members: OrganisationMemberRepository;
    readonly exam_final_submissions: ExamFinalSubmissionRepository;
    readonly exam_grading_scales: TableRepository<"exam_grading_scales">;
    readonly notifications: NotificationRepository;
    readonly mail_preferences: TableRepository<"mail_preferences">;
    readonly edu_users: TableRepository<"edu_users">;
    readonly managed_users: TableRepository<"managed_users">;
    readonly temporary_users: TableRepository<"temporary_users">;
    readonly generators: TableRepository<"generators">;

    constructor(private readonly runner?: Runner) {
        this.users = new UserRepository(runner);
        this.contests = new ContestRepository(runner);
        this.problems = new ProblemRepository(runner);
        this.clusters = new TableRepository("clusters", runner);
        this.testcases = new TableRepository("testcases", runner);
        this.submissions = new SubmissionRepository(runner);
        this.cluster_submissions = new TableRepository("cluster_submissions", runner);
        this.testcase_submissions = new TableRepository("testcase_submissions", runner);
        this.contest_members = new ContestMemberRepository(runner);
        this.contest_questions = new TableRepository("contest_questions", runner);
        this.contest_chat_messages = new ContestChatMessageRepository(runner);
        this.contest_announcements = new TableRepository("contest_announcements", runner);
        this.organisations = new OrganisationRepository(runner);
        this.organisation_members = new OrganisationMemberRepository(runner);
        this.exam_final_submissions = new ExamFinalSubmissionRepository(runner);
        this.exam_grading_scales = new TableRepository("exam_grading_scales", runner);
        this.notifications = new NotificationRepository(runner);
        this.mail_preferences = new TableRepository("mail_preferences", runner);
        this.edu_users = new TableRepository("edu_users", runner);
        this.managed_users = new TableRepository("managed_users", runner);
        this.temporary_users = new TableRepository("temporary_users", runner);
        this.generators = new TableRepository("generators", runner);
    }

    transaction<T>(operation: (repositories: RepositoryRegistry) => Promise<T>): Promise<T> {
        if (this.runner) return operation(this);

        return Database.withTransaction((client: PoolClient) =>
            operation(new RepositoryRegistry(client))
        );
    }
}

export const Repositories = new RepositoryRegistry();
