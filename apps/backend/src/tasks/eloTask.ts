import { Contest } from "@kontestis/models";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
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

    const leaderboard = members.map((member) => ({
        user_id: member.user_id,
        currentGlobalElo: users.find((user) => user.id === member.user_id)?.elo ?? 0,
        problemPoints: Array.from<number>({ length: problems.length })
            .fill(0)
            .concat(Object.values(member.score ?? {}))
            .slice(-problems.length),
    }));

    await Promise.all(
        users.map((user) =>
            Database.update(
                "users",
                {
                    elo:
                        user.elo +
                        computeELODifference(
                            leaderboard.find((it) => it.user_id === user.id)!,
                            problemPoints,
                            leaderboard.filter((it) => it.user_id !== user.id)
                        ),
                },
                { id: user.id, google_id: user.google_id }
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

export const startEloTask = () => {
    Logger.info("Started ELO task");
    setInterval(async () => {
        const potentiallyPending = await Database.selectFrom("contests", "*", {
            elo_applied: false,
        });

        const toDo = potentiallyPending.filter(
            (contest) =>
                Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000
        );

        Logger.debug(
            "Computing ELO for",
            toDo.map((it) => it.id)
        );
        await Promise.all(toDo.map(handleContest));
    }, 60 * 1000);
};
