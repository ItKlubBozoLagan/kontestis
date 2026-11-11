import { formatDistanceToNowStrict } from "date-fns";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { Spinner } from "@/components/common/Spinner";
import type { FeedSubmission } from "@/features/management/overview/useContestSubmissions";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useNow } from "@/hooks/useNow";
import { snowflakeTime } from "@/lib/snowflake";
import { cn } from "@/lib/utils";

const FeedRow = ({ submission }: { submission: FeedSubmission }) => {
    const locale = useDateLocale();
    const at = snowflakeTime(submission.id);

    return (
        <li>
            <Link
                to={`/submission/${submission.id}`}
                className="hover:bg-muted/60 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 transition-colors"
            >
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{submission.full_name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                        {submission.problem.title}
                    </span>
                </span>
                <span className="flex items-center justify-end gap-2">
                    <VerdictBadge
                        verdict={submission.reevaluation ? "pending" : submission.verdict}
                        className="max-w-36 truncate"
                    />
                    <ScoreBadge
                        score={submission.awarded_score}
                        max={submission.problem.score}
                        className="hidden w-16 text-right sm:inline"
                    />
                    <time
                        dateTime={at.toISOString()}
                        className="text-muted-foreground w-20 text-right text-xs tabular-nums"
                    >
                        {formatDistanceToNowStrict(at, { addSuffix: true, locale })}
                    </time>
                </span>
            </Link>
        </li>
    );
};

/** Newest submissions across the whole contest; re-rendered every second for the "time ago". */
export const SubmissionFeed = ({
    submissions,
    isPending,
    className,
}: {
    submissions: FeedSubmission[];
    isPending: boolean;
    className?: string;
}) => {
    const { t } = useTranslation();

    useNow();

    return (
        <Section
            title={t("management.overview.control.feed.title")}
            icon={Activity}
            className={cn("h-fit", className)}
            contentClassName="p-0"
            actions={
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span className="size-2 animate-pulse rounded-full bg-green-500" />
                    {t("management.overview.control.feed.live")}
                </span>
            }
        >
            {isPending && submissions.length === 0 ? (
                <Spinner className="mx-auto my-8" />
            ) : submissions.length === 0 ? (
                <EmptyState
                    icon={Activity}
                    title={t("management.overview.control.feed.empty")}
                    className="py-8"
                />
            ) : (
                <ul className="divide-y">
                    {submissions.map((submission) => (
                        <FeedRow key={submission.id.toString()} submission={submission} />
                    ))}
                </ul>
            )}
        </Section>
    );
};
