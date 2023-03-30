import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import { FC, useEffect } from "react";
import {
    FiActivity,
    FiAlertTriangle,
    FiBarChart2,
    FiGrid,
    FiMessageSquare,
    FiUsers,
} from "react-icons/all";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Link, Navigate } from "react-router-dom";

import { NavItem } from "../../../components/NavElement";
import { ContestContext } from "../../../context/constestContext";
import { useContest } from "../../../hooks/contest/useContest";
import { useSelfContestMembers } from "../../../hooks/contest/useSelfContestMembers";

type PathParameters = {
    contestId: string;
};

const SubRoutes: NavItem[] = [
    {
        display: "Overview",
        href: "overview",
        icon: FiActivity,
    },
    {
        display: "Problems",
        href: "problems",
        icon: FiGrid,
    },
    {
        display: "Announcements",
        href: "announcements",
        icon: FiAlertTriangle,
    },
    {
        display: "Questions",
        href: "questions",
        icon: FiMessageSquare,
    },
    {
        display: "Participants",
        href: "participants",
        icon: FiUsers,
    },
    {
        display: "Results",
        href: "results",
        icon: FiBarChart2,
    },
];

export const ContestManagementLayout: FC = () => {
    const { contestId } = useParams<PathParameters>() as PathParameters;
    const navigate = useNavigate();
    const current = useLocation();

    const {
        isSuccess,
        isError,
        data: contest,
    } = useContest(BigInt(/\d+/g.test(contestId) ? contestId : "0"));

    const {
        isSuccess: isMemberSuccess,
        isError: isMemberError,
        data: members,
    } = useSelfContestMembers();

    useEffect(() => {
        if (!isError || !isMemberError) return;

        navigate("..");
    }, [isError, navigate]);

    if (!isSuccess || !isMemberSuccess) return <div>Loading...</div>;

    const member = members.find((it) => it.contest_id === contest.id);

    if (
        !member ||
        !hasContestPermission(member.contest_permissions, ContestMemberPermissions.ADMIN)
    )
        return <Navigate to={".."} />;

    return (
        <div tw={"flex justify-center w-full"}>
            <div tw={"w-full max-w-[1000px] pt-12 rounded flex flex-col gap-12"}>
                <ContestContext.Provider value={{ contest, member }}>
                    <span tw={"text-3xl w-full"}>Contest » {contest.name}</span>
                    <div tw={"flex flex-col w-full"}>
                        <div tw={"flex w-full bg-neutral-200"}>
                            {SubRoutes.filter(
                                (r) =>
                                    r.href !== "results" ||
                                    (contest.exam &&
                                        contest.start_time.getTime() +
                                            contest.duration_seconds * 1000 <=
                                            Date.now())
                            ).map(({ icon: Icon, ...route }) => (
                                <Link to={route.href} key={route.href} tw={"w-full"}>
                                    <div
                                        tw={
                                            "flex items-center w-full bg-neutral-200 hover:bg-neutral-300 cursor-pointer p-3 relative gap-2"
                                        }
                                    >
                                        <Icon size={"16px"} />
                                        <span>
                                            {route.display}
                                            {current.pathname.endsWith(route.href) && (
                                                <span
                                                    tw={
                                                        "absolute w-full h-0.5 bg-neutral-600 left-0 bottom-0"
                                                    }
                                                ></span>
                                            )}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div tw={"w-full p-6 bg-neutral-100 flex items-center justify-between"}>
                            <Outlet />
                        </div>
                    </div>
                </ContestContext.Provider>
            </div>
        </div>
    );
};
