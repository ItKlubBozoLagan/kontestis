import { Problem } from "@kontestis/models";
import { useMemo, useState } from "react";
import { FC } from "react";
import { useQueries } from "react-query";

import { http, wrapAxios } from "../api/http";
import { BigTitledSection } from "../components/BigTitledSection";
import { Header } from "../components/Header";
import { YearActivityCalendar } from "../components/YearActivityCalendar";
import { useAllContests } from "../hooks/contest/useAllContests";
import { useSubmissionStat } from "../hooks/stats/useSubmissionStat";
import { useAllSubmissions } from "../hooks/submission/useAllSubmissions";
import { useFormatCountStat } from "../hooks/useFormatCountStat";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../state/auth";
import { MetricsInfoBox } from "./admin/overview/charts/metrics/kubernetes/MetricsInfoBox";

export const DashboardPage: FC = () => {
    const { user } = useAuthStore();

    const { data: contests } = useAllContests();
    const { data: submissions } = useAllSubmissions(user.id);
    const problemQueries = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contests", contest.id, "problem"],
            queryFn: () =>
                wrapAxios<Problem[]>(http.get("/problem", { params: { contest_id: contest.id } })),
        }))
    );

    const totalProblems = useMemo(
        () =>
            problemQueries.reduce(
                (accumulator, current) => accumulator + (current.data?.length ?? 0),
                0
            ),
        [problemQueries]
    );

    const [submissionsAccepted, setSubmissionsAccepted] = useState(false);

    const { data: submissionStat, isLoading: isSubmissionsLoading } = useSubmissionStat({
        accepted: submissionsAccepted,
    });

    const submissionDataset = useFormatCountStat(submissionStat);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-6 px-8"}>
            <Header />
            <BigTitledSection header={"Basic information"} tw={"border-neutral-300"}>
                <div tw={"w-full grid grid-cols-3 gap-8 px-12"}>
                    <MetricsInfoBox title={t("dashboard.total.contests")}>
                        {contests?.length ?? 0}
                    </MetricsInfoBox>
                    <MetricsInfoBox title={t("dashboard.total.problems")}>
                        {totalProblems}
                    </MetricsInfoBox>
                    <MetricsInfoBox title={t("dashboard.total.submissions")}>
                        {submissions?.length ?? 0}
                    </MetricsInfoBox>
                </div>
            </BigTitledSection>
            <BigTitledSection header={"Your activity"} tw={"border-neutral-300"}>
                <div tw={"w-fit"}>
                    <YearActivityCalendar
                        title={"Submissions"}
                        dataset={submissionDataset}
                        loading={isSubmissionsLoading}
                        toggles={["show accepted"]}
                        onToggleUpdate={(_, value) => setSubmissionsAccepted(value)}
                    />
                </div>
            </BigTitledSection>
            <BigTitledSection header={"Notifications & alerts"} tw={"border-neutral-300"}>
                <span tw={"text-center text-lg opacity-80"}>None so far!</span>
            </BigTitledSection>
        </div>
    );
};
