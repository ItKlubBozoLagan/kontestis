import { Contest, DEFAULT_ELO, ProblemV2 } from "@kontestis/models";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { Influx } from "../influx/Influx";
import { createInfluxUInt } from "../influx/InfluxClient";
import { computeELODifference, ContestMemberLeaderboardInfo } from "../lib/elo";
import { Logger } from "../lib/logger";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { R } from "../utils/remeda";

const calculateSolvingProbability = (rating: number, difficulty: number) => {
    return 1 / (1 + 10 ** ((difficulty - rating) / 400));
};

const calculatePrecision = (difficulty: number, solves: number[], notSolves: number[]) => {
    const solvesLoss = solves.reduce(
        (loss, elo) => loss * calculateSolvingProbability(elo, difficulty),
        1
    );

    const notSolvesLoss = notSolves.reduce(
        (loss, elo) => loss * (1 - calculateSolvingProbability(elo, difficulty)),
        1
    );

    return notSolvesLoss * solvesLoss;
};

const calculateProblemDifficulties = (
    problems: ProblemV2[],
    problemPoints: number[],
    leaderboard: ContestMemberLeaderboardInfo[]
) => {
    return R.fromPairs(
        problems.map((problem, ind) => {
            const solvesElos = leaderboard
                .filter((user) => user.problemPoints[ind] === problemPoints[ind])
                .map((user) => user.currentGlobalElo);
            const notSolvesElos = leaderboard
                .filter((user) => user.problemPoints[ind] !== problemPoints[ind])
                .map((user) => user.currentGlobalElo);

            const delta = 0.1;

            let low = 400;
            let high = Math.max(leaderboard[0].currentGlobalElo + 200, 400);

            while (high - low > 1) {
                const mid = low + (high - low) / 2;

                if (
                    calculatePrecision(mid, solvesElos, notSolvesElos) <
                    calculatePrecision(mid + delta, solvesElos, notSolvesElos)
                ) {
                    low = mid;
                } else {
                    high = mid;
                }
            }

            const finalDifficulty = Math.round(high);
            const roundedFinalDifficulty = Math.round(finalDifficulty / 100) * 100;

            return [problem.id.toString(), roundedFinalDifficulty];
        })
    );
};

const handleContest = async (contest: Contest) => {
    const cacheKey = RedisKeys.TASK_ELO_PROCESSING(contest.id);

    if (await Redis.exists(cacheKey)) return;

    await Redis.set(cacheKey, contest.id.toString(), { EX: 60 });

    const members = await Database.selectFrom(
        "contest_members",
        "*",
        { contest_id: contest.id },
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "ALLOW FILTERING"
    );

    if (members.length === 0) return;

    const organisationMembers = await Database.selectFrom(
        "organisation_members",
        "*",
        { organisation_id: contest.organisation_id },
        "ALLOW FILTERING"
    );

    const users = await Database.selectFrom("users", "*", {
        id: eqIn(...members.map((it) => it.user_id)),
    });

    const usersWithElo = R.map(
        users.filter((user) => organisationMembers.some((member) => member.user_id === user.id)),
        (user) =>
            R.pipe(
                user,
                R.addProp(
                    "organisationMemberId",
                    organisationMembers.find((member) => member.user_id === user.id)!.id
                ),
                R.addProp(
                    "elo",
                    organisationMembers.find((member) => member.user_id === user.id)?.elo ??
                        DEFAULT_ELO
                )
            )
    );

    const problems = await Database.selectFrom("problems", "*", {
        contest_id: contest.id,
    });

    const problemClusters = await Database.selectFrom(
        "clusters",
        "*",
        {
            problem_id: eqIn(...problems.map((problem) => problem.id)),
        },
        "ALLOW FILTERING"
    );

    const problemPoints = problems.map((problem) =>
        problemClusters
            .filter((cluster) => cluster.problem_id === problem.id)
            .reduce((accumulator, current) => accumulator + current.awarded_score, 0)
    );

    const leaderboard = members
        .filter((member) => usersWithElo.some((user) => user.id === member.user_id))
        .map((member) => ({
            user_id: member.user_id,
            currentGlobalElo: usersWithElo.find((user) => user.id === member.user_id)?.elo ?? 0,
            problemPoints: Array.from<number>({ length: problems.length })
                .fill(0)
                .concat(Object.values(member.score ?? {}))
                .slice(-problems.length),
        }))
        .sort((a, b) => b.currentGlobalElo - a.currentGlobalElo);

    const threshold = Math.min(leaderboard.length, 3 * Math.sqrt(leaderboard.length));

    const eloValuesAfterChange = leaderboard.map((user) => ({
        user_id: user.user_id.toString(),
        newGlobalElo: Math.max(
            0,
            user.currentGlobalElo +
                computeELODifference(
                    leaderboard.find((it) => it.user_id === user.user_id)!,
                    problemPoints,
                    leaderboard.filter((it) => it.user_id !== user.user_id)
                )
        ),
    }));

    const ratingSumBeforeChange = leaderboard.reduce((sum, user, index) => {
        return index < threshold ? sum + user.currentGlobalElo : sum;
    }, 0);

    const ratingSumAfterChange = eloValuesAfterChange.reduce((sum, user, index) => {
        return index < threshold ? sum + user.newGlobalElo : sum;
    }, 0);

    const finalNewRatings = eloValuesAfterChange.map((user, index) => ({
        id: user.user_id.toString(),
        elo: Math.trunc(
            index < threshold
                ? user.newGlobalElo * (ratingSumBeforeChange / ratingSumAfterChange)
                : user.newGlobalElo
        ),
    }));

    const newUserEloValues = R.fromPairs(
        finalNewRatings.map((user) => [user.id.toString(), user.elo])
    );

    const problemDifficulties = calculateProblemDifficulties(problems, problemPoints, leaderboard);

    await Promise.all(
        Object.entries(problemDifficulties).map(async ([problemId, difficulty]) => {
            const problem = await Database.selectOneFrom("problems", ["tags"], { id: problemId });

            if (!problem) return;

            await Database.update(
                "problems",
                { tags: [...problem.tags, `*${difficulty}`] },
                { id: problemId }
            );
        })
    );

    await Promise.all([
        ...usersWithElo.map((user) =>
            Database.update(
                "organisation_members",
                {
                    elo: newUserEloValues[user.id.toString()],
                },
                {
                    id: user.organisationMemberId,
                    user_id: user.id,
                    organisation_id: contest.organisation_id,
                }
            )
        ),
        Influx.insertMany(
            usersWithElo.map((user) =>
                Influx.createLine(
                    "elo",
                    { userId: user.id.toString(), orgId: contest.organisation_id.toString() },
                    { score: createInfluxUInt(newUserEloValues[user.id.toString()]) }
                )
            )
        ),
    ]);

    await Database.update(
        "contests",
        {
            elo_applied: true,
        },
        {
            id: contest.id,
        }
    );

    await Redis.del(cacheKey);
};

export const startEloTask = async () => {
    Logger.info("Started ELO task");
    setInterval(async () => {
        const potentiallyPending = await Database.selectFrom("contests", "*", {
            elo_applied: false,
        });

        const toDo = potentiallyPending.filter(
            (contest) =>
                Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000 &&
                contest.official
        );

        Logger.debug(
            "Computing ELO for",
            toDo.map((it) => it.id)
        );
        await Promise.all(toDo.map(handleContest)).catch(console.error);
    }, 60 * 1000);
};
