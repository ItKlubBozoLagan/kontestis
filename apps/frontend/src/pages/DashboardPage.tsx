import { Problem } from "@kontestis/models";
import { toCroatianLocale } from "@kontestis/utils";
import { useMemo, useState } from "react";
import { FC } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/all";
import { useQueries } from "react-query";

import { http, wrapAxios } from "../api/http";
import { BigTitledSection } from "../components/BigTitledSection";
import { Header } from "../components/Header";
import { YearActivityCalendar } from "../components/YearActivityCalendar";
import { useAllContests } from "../hooks/contest/useAllContests";
import { useSubmissionStat } from "../hooks/stats/useSubmissionStat";
import { useAllSubmissions } from "../hooks/submission/useAllSubmissions";
import { useFormatCountStat } from "../hooks/useFormatCountStat";
import { useInterval } from "../hooks/useInterval";
import { useSiteAlerts } from "../hooks/useSiteAlerts";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../state/auth";
import { MetricsInfoBox } from "./admin/overview/charts/metrics/kubernetes/MetricsInfoBox";

export const DashboardPage: FC = () => {
    const { user } = useAuthStore();

    // loading this page right after login causes the data from react-query not to propagate for some reason,
    //  and everything stays on loading, this will force the state to render and hence update the page
    const [_, setHackyPleaseUpdateState] = useState(false);

    useInterval(() => {
        setHackyPleaseUpdateState((previous) => !previous);
    }, 200);

    const { data: contests } = useAllContests();
    const { data: submissions } = useAllSubmissions(user.id);
    const problemQueries = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contests", contest.id, "problem"],
            queryFn: () =>
                wrapAxios<Problem[]>(http.get("/problem", { params: { contest_id: contest.id } })),
        }))
    );

    const [alertsExpanded, setAlertsExpanded] = useState(false);

    const alerts = useSiteAlerts();

    const totalProblems = useMemo(
        () =>
            problemQueries.reduce(
                (accumulator, current) => accumulator + (current.data?.length ?? 0),
                0
            ),
        [problemQueries]
    );

    const [submissionsAccepted, setSubmissionsAccepted] = useState(false);

    const { data: submissionStat } = useSubmissionStat({
        accepted: submissionsAccepted,
    });

    const submissionDataset = useFormatCountStat(submissionStat);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-6 px-8"}>
            <Header />
            <BigTitledSection header={t("dashboard.basicInfo.title")} tw={"border-neutral-300"}>
                <div tw={"w-full grid grid-cols-3 gap-8 px-12"}>
                    <MetricsInfoBox title={t("dashboard.basicInfo.contests")}>
                        {contests?.length ?? 0}
                    </MetricsInfoBox>
                    <MetricsInfoBox title={t("dashboard.basicInfo.problems")}>
                        {totalProblems}
                    </MetricsInfoBox>
                    <MetricsInfoBox title={t("dashboard.basicInfo.submissions")}>
                        {submissions?.length ?? 0}
                    </MetricsInfoBox>
                </div>
            </BigTitledSection>
            <BigTitledSection header={t("dashboard.alerts.title")} tw={"border-neutral-300"}>
                {alerts.length === 0 && (
                    <span tw={"text-center text-lg opacity-80"}>{t("dashboard.alerts.none")}</span>
                )}
                <div tw={"w-full px-12 flex flex-col items-center gap-4"}>
                    {alerts.slice(0, alertsExpanded ? 8 : 2).map((alert) => (
                        <div
                            key={alert.id.toString()}
                            tw={
                                "w-full text-lg flex flex-col bg-neutral-100 border border-solid border-neutral-400 p-2"
                            }
                        >
                            <span tw={"text-neutral-600 text-sm"}>
                                {toCroatianLocale(alert.created_at)}
                            </span>
                            <span tw={"text-base"}>{alert.data}</span>
                        </div>
                    ))}
                    {alerts.length > 2 && (
                        <div
                            tw={"w-fit flex justify-center items-center gap-2 cursor-pointer"}
                            onClick={() => setAlertsExpanded((previous) => !previous)}
                        >
                            {alertsExpanded ? (
                                <>
                                    <AiFillCaretUp />
                                    Collapse
                                </>
                            ) : (
                                <>
                                    <AiFillCaretDown />
                                    View older
                                </>
                            )}
                        </div>
                    )}
                </div>
            </BigTitledSection>
            <BigTitledSection header={t("dashboard.activity.title")} tw={"border-neutral-300"}>
                <div tw={"w-fit"}>
                    <YearActivityCalendar
                        title={t("account.stats.submissions.title")}
                        dataset={submissionDataset}
                        loading={!submissionStat}
                        toggles={[t("account.stats.submissions.toggles.showAccepted")]}
                        onToggleUpdate={(_, value) => setSubmissionsAccepted(value)}
                    />
                </div>
            </BigTitledSection>
        </div>
    );
};
