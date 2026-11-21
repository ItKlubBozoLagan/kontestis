import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { PageHeader } from "@/components/common/PageHeader";
import { JoinContestDialog } from "@/components/contest/JoinContestDialog";
import { Input } from "@/components/ui/input";
import { ContestsTable } from "@/features/contests/ContestsTable";
import { useOrganisationStore } from "@/stores/organisation";

const SectionTitle = ({ children, count }: { children: React.ReactNode; count: number }) => (
    <h2 className="flex items-baseline gap-2 border-b border-neutral-300 pb-1 text-xl font-normal dark:border-neutral-700">
        {children}
        <span className="text-muted-foreground font-mono text-sm">{count}</span>
    </h2>
);

export const ContestsPage = () => {
    const { t } = useTranslation();
    const organisationId = useOrganisationStore((state) => state.organisationId);
    const { data: contests } = useSuspenseQuery(contestQueries.all());
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();

        return query
            ? contests.filter((contest) => contest.name.toLowerCase().includes(query))
            : contests;
    }, [contests, deferredSearch]);

    const exams = filtered.filter((contest) => contest.exam);
    const official = filtered.filter((contest) => !contest.exam && contest.official);
    const unofficial = filtered.filter((contest) => !contest.exam && !contest.official);

    // the default organisation never hosts exams, so the section is hidden there (like before)
    const showExams = organisationId !== "1" || exams.length > 0;

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={t("contests.page.title")}
                description={t("contests.page.description")}
                actions={
                    <>
                        <div className="relative w-64">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t("contests.page.search")}
                                className="bg-background pl-8"
                            />
                        </div>
                        <JoinContestDialog variant="outline" />
                    </>
                }
            />
            {showExams && (
                <section className="flex flex-col gap-3">
                    <SectionTitle count={exams.length}>{t("contests.page.exams")}</SectionTitle>
                    <ContestsTable contests={exams} />
                </section>
            )}
            <section className="flex flex-col gap-3">
                <SectionTitle count={official.length}>{t("contests.page.official")}</SectionTitle>
                <ContestsTable contests={official} />
            </section>
            <section className="flex flex-col gap-3">
                <SectionTitle count={unofficial.length}>
                    {t("contests.page.unofficial")}
                </SectionTitle>
                <ContestsTable contests={unofficial} />
            </section>
        </div>
    );
};
