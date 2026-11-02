import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { PageHeader } from "@/components/common/PageHeader";
import { ContestsTable } from "@/features/contests/ContestsTable";

/** Landing page of temporary (contest-locked) accounts. */
export const TemporaryHomePage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const { data: contests } = useSuspenseQuery(contestQueries.all());

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={t("contests.temporary.title")} description={user.full_name} />
            <ContestsTable contests={contests} hidePartaking />
        </div>
    );
};
