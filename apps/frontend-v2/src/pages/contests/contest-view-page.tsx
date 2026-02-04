import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Clock, FileCode, Megaphone, MessageSquare, Send, Timer, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import {
    useAllContestAnnouncements,
    useAllContestQuestions,
    useCreateQuestion,
} from "@/api/contest-extras";
import { useContest } from "@/api/contests";
import { useAllProblems, useAllProblemScores } from "@/api/problems";
import { Leaderboard } from "@/components/leaderboard";
import { ScoreBadge } from "@/components/score-badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const questionSchema = z.object({
    question: z.string().min(1, "Question is required"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export function ContestViewPage() {
    const { contestId } = useParams<{ contestId: string }>();
    const contestIdBigInt = useMemo(() => BigInt(contestId ?? 0), [contestId]);
    const { t } = useTranslation();

    const { data: contest, isLoading: contestLoading } = useContest(contestIdBigInt);
    const { data: problems } = useAllProblems(contestIdBigInt);
    const { data: problemScores } = useAllProblemScores();
    const { data: announcements } = useAllContestAnnouncements(contestIdBigInt);
    const { data: questions } = useAllContestQuestions(contestIdBigInt);

    const createQuestionMutation = useCreateQuestion(contestIdBigInt);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<QuestionFormData>({
        resolver: zodResolver(questionSchema),
    });

    // Format countdown time
    const formatCountdown = (ms: number): string => {
        if (ms <= 0) return "0s";

        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / 86_400);
        const hours = Math.floor((totalSeconds % 86_400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts: string[] = [];

        if (days > 0) parts.push(`${days}d`);

        if (hours > 0) parts.push(`${hours}h`);

        if (minutes > 0) parts.push(`${minutes}m`);

        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

        return parts.join(" ");
    };

    // Live countdown timer state
    const [timeRemaining, setTimeRemaining] = useState(0);

    const contestStatus = useMemo(() => {
        if (!contest) return "pending";

        const now = Date.now();
        const startTime = new Date(contest.start_time).getTime();
        const endTime = startTime + contest.duration_seconds * 1000;

        if (now < startTime) {
            return "pending";
        } else if (now < endTime) {
            return "running";
        } else {
            return "finished";
        }
    }, [contest]);

    // Update countdown every second
    useEffect(() => {
        if (!contest) return;

        const startTime = new Date(contest.start_time).getTime();
        const endTime = startTime + contest.duration_seconds * 1000;

        const updateTimer = () => {
            const now = Date.now();

            if (contestStatus === "pending") {
                setTimeRemaining(startTime - now);
            } else if (contestStatus === "running") {
                setTimeRemaining(endTime - now);
            } else {
                setTimeRemaining(0);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [contest, contestStatus]);

    const getStatusDisplay = () => {
        if (contestStatus === "pending") {
            return `Starts in ${formatCountdown(timeRemaining)}`;
        } else if (contestStatus === "running") {
            return `Ends in ${formatCountdown(timeRemaining)}`;
        } else {
            return "Contest finished";
        }
    };

    const sortedProblems = useMemo(() => {
        return (problems ?? []).sort((a, b) => {
            if (a.score === b.score) return a.title.localeCompare(b.title);

            return a.score - b.score;
        });
    }, [problems]);

    const onQuestionSubmit = handleSubmit((data) => {
        createQuestionMutation.mutate(data, {
            onSuccess: () => reset(),
        });
    });

    if (contestLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Contest not found</p>
            </div>
        );
    }

    const statusColors = {
        pending: "bg-yellow-500/20 border-yellow-500 text-yellow-600 dark:text-yellow-400",
        running: "bg-green-500/20 border-green-500 text-green-600 dark:text-green-400",
        finished: "bg-gray-500/20 border-gray-500 text-gray-600 dark:text-gray-400",
    };

    return (
        <div className="space-y-6">
            {/* Contest Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-primary" />
                        {contest.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(contest.start_time), "MMMM d, yyyy 'at' HH:mm")}
                    </p>
                </div>
                <Badge
                    className={cn(
                        "text-sm px-4 py-2 border-2 whitespace-nowrap flex items-center",
                        statusColors[contestStatus as keyof typeof statusColors]
                    )}
                >
                    <Timer className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{getStatusDisplay()}</span>
                </Badge>
            </div>

            <Tabs defaultValue="problems">
                <TabsList>
                    <TabsTrigger value="problems" className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        {t("navbar.problems")}
                    </TabsTrigger>
                    {contestStatus === "running" && (
                        <>
                            <TabsTrigger value="announcements" className="flex items-center gap-2">
                                <Megaphone className="h-4 w-4" />
                                {t("contests.individual.announcements.label")}
                                {(announcements?.length ?? 0) > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {announcements?.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="questions" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                {t("contests.individual.questions.label")}
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* Problems Tab */}
                <TabsContent value="problems" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCode className="h-5 w-5" />
                                {t("navbar.problems")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sortedProblems.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("contests.individual.leaderboard.emptyMessage")}
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t("contests.individual.problems_table.problem")}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t("problems.table.head.score")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedProblems.map((problem) => {
                                            const userScore =
                                                problemScores?.[problem.id.toString()] ?? 0;

                                            return (
                                                <TableRow key={problem.id.toString()}>
                                                    <TableCell>
                                                        <Link
                                                            to={`/problem/${problem.id}`}
                                                            className="flex items-center gap-3 hover:text-primary transition-colors"
                                                        >
                                                            <FileCode className="h-5 w-5 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {problem.title}
                                                            </span>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ScoreBadge
                                                            score={userScore}
                                                            maxScore={problem.score}
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
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                {t("contests.individual.announcements.label")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(announcements?.length ?? 0) === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("contests.individual.announcements.empty")}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {announcements?.map((announcement) => (
                                        <div
                                            key={announcement.id.toString()}
                                            className="p-4 border rounded-lg bg-muted/50"
                                        >
                                            <p className="font-mono">{announcement.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                {t("contests.individual.questions.label")}
                            </CardTitle>
                            <CardDescription>
                                {t("contests.individual.questions.ask")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Ask Question Form */}
                            <form onSubmit={onQuestionSubmit} className="flex gap-3">
                                <Input
                                    placeholder="Type your question..."
                                    {...register("question")}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={createQuestionMutation.isPending}>
                                    <Send className="h-4 w-4 mr-2" />
                                    {t("contests.individual.questions.sendButton")}
                                </Button>
                            </form>
                            {errors.question && (
                                <p className="text-sm text-destructive">
                                    {errors.question.message}
                                </p>
                            )}

                            {/* Questions List */}
                            {(questions?.length ?? 0) === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    No questions asked yet
                                </p>
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {questions
                                        ?.sort((a, b) => Number(b.id - a.id))
                                        .map((question) => (
                                            <AccordionItem
                                                key={question.id.toString()}
                                                value={question.id.toString()}
                                            >
                                                <AccordionTrigger className="hover:no-underline">
                                                    <span className="text-left">
                                                        {question.question}
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    {question.response ? (
                                                        <p className="text-foreground p-3 bg-muted rounded-lg">
                                                            {question.response}
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground italic">
                                                            Waiting for response...
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                </Accordion>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Leaderboard */}
            {contest && problems && <Leaderboard contest={contest} problems={sortedProblems} />}
        </div>
    );
}
