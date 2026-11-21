import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { useLeaderboardVisibility } from "@/features/contests/ContestLeaderboard";
import { useContestProblems } from "@/features/contests/ContestProblems";
import { useExamFinals } from "@/features/contests/examFinals";
import { contestPhase } from "@/lib/contest";

const Figure = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
    <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className="font-mono text-2xl leading-tight font-semibold tabular-nums">
            {value}
            <span className="text-muted-foreground text-sm font-normal"> {detail}</span>
        </span>
    </div>
);

/** Exam version: only final submissions are graded, so show those instead of score/place. */
const ExamStanding = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { problems } = useContestProblems(contest.id);
    const { byProblem } = useExamFinals(contest);

    if (problems.length === 0) return null;

    const finals = problems.flatMap((problem) => byProblem.get(problem.id.toString()) ?? []);
    const total = problems.reduce((sum, problem) => sum + problem.score, 0);
    const points = finals.reduce((sum, final) => sum + final.final_score, 0);
    const missing = problems.length - finals.length;

    return (
        <div className="bg-card flex flex-col rounded-md border">
            <div className="flex divide-x">
                <Figure
                    label={t("contests.exam.finalsChosen")}
                    value={finals.length.toString()}
                    detail={`/ ${problems.length}`}
                />
                <Figure
                    label={t("contests.exam.finalScore")}
                    value={points.toString()}
                    detail={`/ ${total}`}
                />
            </div>
            {missing > 0 && contestPhase(contest) === "running" && (
                <p className="flex items-center gap-1.5 border-t px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="size-4 shrink-0" />
                    {t("contests.exam.missingFinals", { count: missing })}
                </p>
            )}
        </div>
    );
};

/** The registered viewer's own score, solved count and (when visible) place. */
const ScoreStanding = ({
    contest,
    canViewPrivate,
}: {
    contest: Contest;
    canViewPrivate: boolean;
}) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const visibility = useLeaderboardVisibility(contest, canViewPrivate);
    const { problems } = useContestProblems(contest.id);
    const { data: scores } = useQuery(problemQueries.scores());
    const { data: members } = useQuery({
        ...contestQueries.leaderboard(contest.id, false),
        enabled: visibility === "visible",
        refetchInterval: contestPhase(contest) === "running" ? 30_000 : false,
    });

    if (problems.length === 0) return null;

    const total = problems.reduce((sum, problem) => sum + problem.score, 0);
    const mine = problems.reduce((sum, problem) => sum + (scores?.[problem.id.toString()] ?? 0), 0);
    const solved = problems.filter(
        (problem) => (scores?.[problem.id.toString()] ?? 0) >= problem.score && problem.score > 0
    ).length;

    const totals = (members ?? []).map((member) => ({
        userId: member.user_id,
        total: Object.values(member.score ?? {}).reduce((sum, score) => sum + score, 0),
    }));
    const own = totals.find((it) => it.userId === user.id);
    // equal totals share a place, like the leaderboard
    const place = own ? totals.filter((it) => it.total > own.total).length + 1 : undefined;

    return (
        <div className="bg-card flex divide-x rounded-md border">
            <Figure
                label={t("contests.standing.score")}
                value={mine.toString()}
                detail={`/ ${total}`}
            />
            <Figure
                label={t("contests.standing.solved")}
                value={solved.toString()}
                detail={`/ ${problems.length}`}
            />
            {place !== undefined && (
                <Figure
                    label={t("contests.standing.place")}
                    value={`${place}.`}
                    detail={t("contests.standing.of", { count: totals.length })}
                />
            )}
        </div>
    );
};

/** Own progress card: final submissions in an exam, score/solved/place otherwise. */
export const ContestStanding = ({
    contest,
    canViewPrivate,
}: {
    contest: Contest;
    canViewPrivate: boolean;
}) =>
    contest.exam ? (
        <ExamStanding contest={contest} />
    ) : (
        <ScoreStanding contest={contest} canViewPrivate={canViewPrivate} />
    );
