import { Contest } from "@kontestis/models";
import * as R from "remeda";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { Influx } from "../influx/Influx";
import { createInfluxUInt } from "../influx/InfluxClient";
import { computeELODifference } from "../lib/elo";
import { Logger } from "../lib/logger";

const handleContest = async (contest: Contest) => {
    const members = await Database.selectFrom(
        "contest_members",
        "*",
        { contest_id: contest.id },
        "ALLOW FILTERING"
    );

    if (members.length === 0) return;

    const users = await Database.selectFrom("users", "*", {
        id: eqIn(...members.map((it) => it.user_id)),
    });

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
        .map((member) => ({
            user_id: member.user_id,
            currentGlobalElo: users.find((user) => user.id === member.user_id)?.elo ?? 0,
            problemPoints: Array.from<number>({ length: problems.length })
                .fill(0)
                .concat(Object.values(member.score ?? {}))
                .slice(-problems.length),
        }))
        .sort((a, b) => b.currentGlobalElo - a.currentGlobalElo);

    const treshold = Math.min(leaderboard.length, 3 * Math.sqrt(leaderboard.length));

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

    const ratingSumBeforeChange = leaderboard.reduce((sum, user, ind) => {
        return ind < treshold ? sum + user.currentGlobalElo : sum;
    }, 0);

    const ratingSumAfterChange = eloValuesAfterChange.reduce((sum, user, ind) => {
        return ind < treshold ? sum + user.newGlobalElo : sum;
    }, 0);

    const finalNewRatings = eloValuesAfterChange.map((user, ind) => ({
        id: user.user_id.toString(),
        elo:
            ind < treshold
                ? user.newGlobalElo * (ratingSumBeforeChange / ratingSumAfterChange)
                : user.newGlobalElo,
    }));

    const newUserEloValues = R.fromPairs(
        finalNewRatings.map((user) => [user.id.toString(), user.elo])
    );

    await Promise.all([
        ...users.map((user) =>
            Database.update(
                "users",
                {
                    elo: newUserEloValues[user.id.toString()],
                },
                { id: user.id, google_id: user.google_id }
            )
        ),
        Influx.insertMany(
            users.map((user) =>
                Influx.createLine(
                    "elo",
                    // TODO: organisations
                    { userId: user.id.toString(), orgId: "1" },
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
};

export const startEloTask = () => {
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
        await Promise.all(toDo.map(handleContest));
    }, 60 * 1000);
};
