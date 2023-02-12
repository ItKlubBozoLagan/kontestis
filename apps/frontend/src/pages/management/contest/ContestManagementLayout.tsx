import { FC, useEffect } from "react";
import { FiActivity, FiAlertTriangle, FiGrid, FiMessageSquare, FiUsers } from "react-icons/all";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Link } from "react-router-dom";

import { NavItem } from "../../../components/NavElement";
import { ContestContext } from "../../../context/constestContext";
import { useContest } from "../../../hooks/contest/useContest";

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
        display: "Alerts",
        href: "alerts",
        icon: FiAlertTriangle,
    },
    {
        display: "Messages",
        href: "messages",
        icon: FiMessageSquare,
    },
    {
        display: "Participants",
        href: "participants",
        icon: FiUsers,
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

    useEffect(() => {
        if (!isError) return;

        navigate("..");
    }, [isError, navigate]);

    if (!isSuccess) return <div>Loading...</div>;

    return (
        <div tw={"flex justify-center w-full"}>
            <div tw={"max-w-[1100px] w-full pt-12 rounded flex flex-col gap-12"}>
                <ContestContext.Provider value={contest}>
                    <span tw={"text-3xl w-full"}>Contest » {contest.name}</span>
                    <div tw={"flex flex-col w-full"}>
                        <div tw={"flex w-full bg-neutral-200"}>
                            {SubRoutes.map((route) => (
                                <Link key={route.href} to={route.href}>
                                    <div
                                        tw={
                                            "bg-neutral-200 hover:bg-neutral-300 cursor-pointer p-3 relative"
                                        }
                                    >
                                        {route.display}
                                        {current.pathname.endsWith(route.href) && (
                                            <span
                                                tw={
                                                    "absolute w-full h-0.5 bg-neutral-600 left-0 bottom-0"
                                                }
                                            ></span>
                                        )}
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
