import { Contest } from "@kontestis/models";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { computeELODifference } from "../lib/elo";

const handleContest = async (contest: Contest) => {
    const members = await Database.selectFrom(
        "contest_members",
        "*",
        { contest_id: contest.id },
        "ALLOW FILTERING"
    );

    const users = await Database.selectFrom("users", "*", {
        id: eqIn(...members.map((it) => it.id)),
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
        currentGlobalElo: users.find((user) => user.id === member.id)?.elo ?? 0,
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
                { id: user.id }
            )
        )
    );
};

export const startEloTask = () => {
    setInterval(async () => {
        const potentiallyPending = await Database.selectFrom("contests", "*", {
            elo_applied: false,
        });

        const toDo = potentiallyPending.filter(
            (contest) =>
                Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000
        );

        await Promise.all(toDo.map(handleContest));
    }, 60 * 1000);
};
