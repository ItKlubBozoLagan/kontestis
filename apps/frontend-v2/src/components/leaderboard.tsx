import { Trophy } from "lucide-react";
import { useMemo } from "react";

import { useContestLeaderboard } from "@/api/submissions";
import { ScoreBadge } from "@/components/score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

interface Problem {
    id: bigint;
    title: string;
    score: number;
}

interface Contest {
    id: bigint;
    name: string;
    start_time: Date;
    duration_seconds: number;
    show_leaderboard_during_contest?: boolean;
}

interface LeaderboardProperties {
    contest: Contest;
    problems: Problem[];
}

export function Leaderboard({ contest, problems }: LeaderboardProperties) {
    const { user } = useAuthStore();

    const contestEnded =
        Date.now() >= new Date(contest.start_time).getTime() + contest.duration_seconds * 1000;
    const contestStarted = Date.now() >= new Date(contest.start_time).getTime();

    const leaderboardVisible = useMemo(
        () => contest.show_leaderboard_during_contest || contestEnded,
        [contest.show_leaderboard_during_contest, contestEnded]
    );

    const { data, isSuccess } = useContestLeaderboard(contest.id, {
        enabled: leaderboardVisible && contestStarted,
    });

    const maxScore = problems.reduce((accumulator, p) => accumulator + p.score, 0);

    const sortedProblems = useMemo(() => {
        return [...problems].sort((a, b) => {
            if (a.score === b.score) return a.title.localeCompare(b.title);

            return a.score - b.score;
        });
    }, [problems]);

    const contestMembers = useMemo(() => {
        if (!isSuccess || !data) return [];

        return data
            .map((member) => ({
                ...member,
                total_score: Object.values(member.score || {}).reduce(
                    (accumulator, current) => accumulator + current,
                    0
                ),
            }))
            .sort((a, b) => b.total_score - a.total_score);
    }, [isSuccess, data]);

    if (!contestStarted) return null;

    if (!leaderboardVisible) {
        return (
            <Card className="mt-6">
                <CardContent className="py-8 text-center text-muted-foreground">
                    Leaderboard is hidden during contest
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {contestEnded ? "Final Standings" : "Leaderboard"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {contestMembers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">No participants yet</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Contestant</TableHead>
                                {sortedProblems.map((problem) => (
                                    <TableHead key={problem.id.toString()} className="text-center">
                                        {problem.title}
                                    </TableHead>
                                ))}
                                <TableHead className="text-center">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contestMembers.map((member, index) => {
                                const isCurrentUser = user && member.user_id === user.id;
                                const rankColors = [
                                    "text-yellow-600 font-bold", // 1st
                                    "text-gray-500 font-semibold", // 2nd
                                    "text-amber-700 font-semibold", // 3rd
                                ];

                                return (
                                    <TableRow
                                        key={member.id.toString()}
                                        className={cn(isCurrentUser && "bg-primary/5")}
                                    >
                                        <TableCell className={rankColors[index] ?? ""}>
                                            {index + 1}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                isCurrentUser && "text-primary font-medium"
                                            )}
                                        >
                                            {member.full_name}
                                        </TableCell>
                                        {sortedProblems.map((problem) => {
                                            const problemScore =
                                                member.score?.[problem.id.toString()];

                                            return (
                                                <TableCell
                                                    key={problem.id.toString()}
                                                    className="text-center"
                                                >
                                                    <ScoreBadge
                                                        score={problemScore}
                                                        maxScore={problem.score}
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="text-center">
                                            <ScoreBadge
                                                score={member.total_score}
                                                maxScore={maxScore}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
