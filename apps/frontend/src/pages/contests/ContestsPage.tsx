import { FC } from "react";

import { PageTitle } from "../../components/PageTitle";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useTranslation } from "../../hooks/useTranslation";
import { useOrganisationStore } from "../../state/organisation";
import { ContestsTable } from "./ContestsTable";

export const ContestsPage: FC = () => {
    const { isSuccess, data: contests } = useAllContests();
    const { data: contestMembers } = useSelfContestMembers();
    const { organisationId } = useOrganisationStore();

    const completeContests = useMappedContests(contests, contestMembers);

    const { t } = useTranslation();

    if (!isSuccess) return <span>{t("contests.page.loading")}</span>;

    return (
        <div tw={"w-full flex flex-col"}>
            {organisationId !== 1n && (
                <>
                    <PageTitle>{t("contests.page.exams")}</PageTitle>
                    <ContestsTable contests={completeContests.filter((c) => c.exam)} />
                </>
            )}
            <PageTitle>{t("contests.page.official")}</PageTitle>
            <ContestsTable contests={completeContests.filter((c) => !c.exam && c.official)} />
            <PageTitle>{t("contests.page.unofficial")}</PageTitle>
            <ContestsTable contests={completeContests.filter((c) => !c.exam && !c.official)} />
        </div>
    );
};
