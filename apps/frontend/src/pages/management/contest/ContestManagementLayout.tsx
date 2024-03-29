import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { FC, useEffect, useMemo } from "react";
import {
    FiActivity,
    FiAlertTriangle,
    FiBarChart2,
    FiGrid,
    FiMessageSquare,
    FiUsers,
} from "react-icons/all";
import { Outlet, useNavigate, useParams } from "react-router";
import { Navigate } from "react-router-dom";

import { SubRouteNavBar } from "../../../components/SubRouteNavBar";
import { Translated } from "../../../components/Translated";
import { ContestContext } from "../../../context/constestContext";
import { useContest } from "../../../hooks/contest/useContest";
import { useSelfContestMembers } from "../../../hooks/contest/useSelfContestMembers";
import { useTranslation } from "../../../hooks/useTranslation";
import { useAuthStore } from "../../../state/auth";

type PathParameters = {
    contestId: string;
};

export const ContestManagementLayout: FC = () => {
    const { contestId } = useParams<PathParameters>() as PathParameters;
    const navigate = useNavigate();
    const {
        isSuccess,
        isError,
        data: contest,
    } = useContest(BigInt(/\d+/g.test(contestId) ? contestId : "0"));

    const { user } = useAuthStore();

    const {
        isSuccess: isMemberSuccess,
        isError: isMemberError,
        data: members,
    } = useSelfContestMembers();

    useEffect(() => {
        if (!isError || !isMemberError) return;

        navigate("..");
    }, [isError, navigate]);

    const { t } = useTranslation();

    const SubRoutes = useMemo(
        () => [
            {
                display: t("contests.management.individual.routes.overview"),
                href: "overview",
                icon: FiActivity,
            },
            {
                display: t("contests.management.individual.routes.problems"),
                href: "problems",
                icon: FiGrid,
            },
            {
                display: t("contests.management.individual.routes.announcements"),
                href: "announcements",
                icon: FiAlertTriangle,
            },
            {
                display: t("contests.management.individual.routes.questions"),
                href: "questions",
                icon: FiMessageSquare,
            },
            {
                display: t("contests.management.individual.routes.participants"),
                href: "participants",
                icon: FiUsers,
            },
            {
                display: t("contests.management.individual.routes.results"),
                href: "results",
                icon: FiBarChart2,
            },
        ],
        [t]
    );

    if (!isSuccess || !isMemberSuccess) return <div>Loading...</div>;

    const member = members.find((it) => it.contest_id === contest.id);

    if (
        (!member ||
            !hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.VIEW_PRIVATE
            )) &&
        !hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)
    )
        return <Navigate to={".."} />;

    return (
        <div tw={"flex justify-center w-full"}>
            <div tw={"w-full max-w-[1000px] pt-12 rounded flex flex-col gap-12"}>
                <ContestContext.Provider value={{ contest, member }}>
                    <span tw={"text-3xl w-full"}>
                        <Translated translationKey="contests.management.individual.title">
                            {contest.name}
                        </Translated>
                    </span>
                    <div tw={"flex flex-col w-full"}>
                        <SubRouteNavBar
                            routes={SubRoutes.filter(
                                (route) =>
                                    route.href !== "results" ||
                                    (contest.exam &&
                                        contest.start_time.getTime() +
                                            contest.duration_seconds * 1000 <=
                                            Date.now())
                            )}
                        />
                        <div tw={"w-full p-6 bg-neutral-100 flex items-center justify-between"}>
                            <Outlet />
                        </div>
                    </div>
                </ContestContext.Provider>
            </div>
        </div>
    );
};
