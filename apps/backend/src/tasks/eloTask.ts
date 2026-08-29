import { randomBytes } from "node:crypto";

import { Contest, DEFAULT_ELO, EloHistoryEntry, ProblemV2, Snowflake } from "@kontestis/models";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { computeELODifference, ContestMemberLeaderboardInfo } from "../lib/elo";
import { Logger } from "../lib/logger";
import { legacyPendingEloContests } from "../metrics/prometheus";
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
    const members = await Database.selectFrom(
        "contest_members",
        "*",
        { contest_id: contest.id },
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "ALLOW FILTERING"
    );

    if (members.length === 0) {
        await Database.update("contests", { elo_applied: true }, { id: contest.id });

        return;
    }

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

    if (usersWithElo.length === 0) {
        await Database.update("contests", { elo_applied: true }, { id: contest.id });

        return;
    }

    const eventId = `contest:${contest.id}`;
    const existingHistory = (
        await Promise.all(
            usersWithElo.map((user) =>
                Database.selectOneFrom("elo_history", "*", {
                    user_id: user.id,
                    organisation_id: contest.organisation_id,
                    event_id: eventId,
                })
            )
        )
    ).filter((entry): entry is EloHistoryEntry => entry !== undefined);

    if (existingHistory.length === usersWithElo.length) {
        await Promise.all(
            usersWithElo.map((user) => {
                const history = existingHistory.find((entry) => entry.user_id === user.id)!;

                return Database.update(
                    "organisation_members",
                    { elo: history.resulting_elo },
                    {
                        id: user.organisationMemberId,
                        user_id: user.id,
                        organisation_id: contest.organisation_id,
                    }
                );
            })
        );

        await Database.update("contests", { elo_applied: true }, { id: contest.id });

        return;
    }

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
                {
                    tags: [...problem.tags.filter((tag) => !/^\*\d+$/.test(tag)), `*${difficulty}`],
                },
                { id: problemId }
            );
        })
    );

    const recordedAt = existingHistory[0]?.recorded_at ?? new Date();

    await Promise.all(
        usersWithElo.map((user) =>
            Database.insertInto("elo_history", {
                user_id: user.id,
                organisation_id: contest.organisation_id,
                event_id: eventId,
                recorded_at: recordedAt,
                contest_id: contest.id,
                delta: newUserEloValues[user.id.toString()] - user.elo,
                resulting_elo: newUserEloValues[user.id.toString()],
                source: "contest",
            })
        )
    );

    await Promise.all(
        usersWithElo.map((user) =>
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
        )
    );

    await Database.update(
        "contests",
        {
            elo_applied: true,
        },
        {
            id: contest.id,
        }
    );
};

const withOrganisationLock = async (organisationId: Snowflake, action: () => Promise<void>) => {
    const key = RedisKeys.TASK_ELO_ORGANISATION(organisationId);
    const token = randomBytes(24).toString("base64url");
    const lockDurationSeconds = 120;
    const acquired = await Redis.set(key, token, { EX: lockDurationSeconds, NX: true });

    if (!acquired) return;

    const renew = setInterval(() => {
        Redis.eval(
            `if redis.call("GET", KEYS[1]) == ARGV[1] then
                return redis.call("EXPIRE", KEYS[1], ARGV[2])
            end
            return 0`,
            {
                keys: [key],
                arguments: [token, lockDurationSeconds.toString()],
            }
        ).catch(console.error);
    }, (lockDurationSeconds * 1000) / 3);

    try {
        await action();
    } finally {
        clearInterval(renew);
        await Redis.eval(
            `if redis.call("GET", KEYS[1]) == ARGV[1] then
                return redis.call("DEL", KEYS[1])
            end
            return 0`,
            { keys: [key], arguments: [token] }
        );
    }
};

const processPendingElo = async () => {
    const potentiallyPending = await Database.selectFrom("contests", "*", {
        elo_applied: false,
    });

    const endedOfficial = potentiallyPending.filter(
        (contest) =>
            Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000 &&
            contest.official
    );
    const legacyPending = endedOfficial.filter((contest) => contest.elo_processing_version !== 1);
    const toDo = endedOfficial.filter((contest) => contest.elo_processing_version === 1);

    legacyPendingEloContests.set(legacyPending.length);

    if (legacyPending.length > 0)
        Logger.error(
            "Skipping legacy contests with unknown ELO application state",
            legacyPending.map((contest) => contest.id)
        );

    Logger.debug(
        "Computing ELO for",
        toDo.map((contest) => contest.id)
    );

    const byOrganisation = new Map<string, Contest[]>();

    for (const contest of toDo) {
        const key = contest.organisation_id.toString();
        const contests = byOrganisation.get(key) ?? [];

        contests.push(contest);
        byOrganisation.set(key, contests);
    }

    await Promise.all(
        [...byOrganisation.values()].map((contests) =>
            withOrganisationLock(contests[0].organisation_id, async () => {
                const chronological = contests.sort(
                    (a, b) =>
                        a.start_time.getTime() +
                        a.duration_seconds * 1000 -
                        (b.start_time.getTime() + b.duration_seconds * 1000)
                );

                for (const contest of chronological) await handleContest(contest);
            })
        )
    );
};

const runPendingElo = () => processPendingElo().catch(console.error);

export const startEloTask = () => {
    Logger.info("Started ELO task");

    runPendingElo();
    setInterval(runPendingElo, 60 * 1000);
};
