import type { Contest } from "@kontestis/models";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ContestClock } from "@/components/contest/ContestClock";
import { Button } from "@/components/ui/button";
import { ContestStanding } from "@/features/contests/ContestStanding";

const LiveContestCard = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();

    return (
        <article className="bg-card border-primary/40 flex flex-col gap-4 rounded-md border-2 p-4 shadow-sm">
            <h3 className="text-xl leading-tight font-medium break-words sm:text-2xl">
                {contest.name}
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
                <ContestClock contest={contest} className="bg-background" />
                <div className="flex flex-col justify-between gap-4">
                    <ContestStanding contest={contest} canViewPrivate={false} />
                    <Button asChild size="lg" className="w-full lg:w-auto lg:self-end">
                        <Link to={`/contest/${contest.id}`}>
                            {t("dashboard.live.continue")}
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </div>
        </article>
    );
};

/** Running contests the user is registered for: the thing they most likely came to do. */
export const LiveContests = ({ contests }: { contests: Contest[] }) => {
    const { t } = useTranslation();

    if (contests.length === 0) return null;

    return (
        <section className="flex flex-col gap-3" aria-labelledby="dashboard-live">
            <h2 id="dashboard-live" className="sr-only">
                {t("dashboard.live.title")}
            </h2>
            {contests.map((contest) => (
                <LiveContestCard key={contest.id.toString()} contest={contest} />
            ))}
        </section>
    );
};
