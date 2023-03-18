import "twin.macro";
import "./globals.scss";

import { FullUser } from "@kontestis/models";
import React, { useEffect } from "react";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { http, wrapAxios } from "./api/http";
import { AccountPage } from "./pages/account/AccountPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { ContestsPage } from "./pages/contests/ContestsPage";
import { ContestViewPage } from "./pages/contests/ContestViewPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ContestAnnouncementsPage } from "./pages/management/contest/announcements/ContestAnnouncementsPage";
import { ContestManagementLayout } from "./pages/management/contest/ContestManagementLayout";
import { ContestOverviewPage } from "./pages/management/contest/overview/ContestOverviewPage";
import { ContestParticipantsPage } from "./pages/management/contest/participants/ContestParticipantsPage";
import { ContestProblemsPage } from "./pages/management/contest/problems/ContestProblemsPage";
import { ContestQuestionsPage } from "./pages/management/contest/questions/ContestQuestionsPage";
import { ManagementPage } from "./pages/management/ManagementPage";
import { ProblemsPage } from "./pages/problems/ProblemsPage";
import { ProblemViewPage } from "./pages/problems/ProblemViewPage";
import { Root } from "./pages/Root";
import { SubmissionViewPage } from "./pages/submissions/SubmissionViewPage";
import { useAuthStore } from "./state/auth";
import { useTokenStore } from "./state/token";

Modal.setAppElement("#root");

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const dashboardRouter = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <DashboardPage />,
            },
            {
                path: "/submission/:submissionId",
                element: <SubmissionViewPage />,
            },
            {
                path: "/problem/:problemId",
                element: <ProblemViewPage />,
            },
            {
                path: "/contest/:contestId",
                element: <ContestViewPage />,
            },
            {
                path: "/problems",
                element: <ProblemsPage />,
            },
            {
                path: "/contests",
                element: <ContestsPage />,
            },
            {
                path: "/account",
                element: <AccountPage />,
            },
            {
                path: "/management",
                element: <ManagementPage />,
            },
            {
                path: "/management/:contestId",
                element: <ContestManagementLayout />,
                children: [
                    {
                        path: "overview",
                        element: <ContestOverviewPage />,
                    },
                    {
                        path: "problems",
                        element: <ContestProblemsPage />,
                    },
                    {
                        path: "announcements",
                        element: <ContestAnnouncementsPage />,
                    },
                    {
                        path: "questions",
                        element: <ContestQuestionsPage />,
                    },
                    {
                        path: "participants",
                        element: <ContestParticipantsPage />,
                    },
                    {
                        index: true,
                        element: <Navigate to={"problems"} replace />,
                    },
                ],
            },
            {
                path: "/*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
]);

const loginRouter = createBrowserRouter([
    {
        path: "/",
        element: <Root hideNavbar />,
        children: [
            {
                path: "/",
                element: <LoginPage />,
            },
            {
                path: "/*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
]);

export const App = () => {
    const { isLoggedIn, setUser, setIsLoggedIn } = useAuthStore();
    const { token, setToken } = useTokenStore();

    const queryClient = useQueryClient();

    useEffect(() => {
        if (token.length === 0) {
            setIsLoggedIn(false);
            queryClient.clear();

            return;
        }

        wrapAxios<FullUser>(http.get("/auth/info"))
            .then((data) => {
                setUser(data);
                setIsLoggedIn(true);
            })
            .catch(() => setToken(""));
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (token.length === 0) return;

            wrapAxios<FullUser>(http.get("/auth/info"))
                .then((data) => {
                    setUser(data);
                    setIsLoggedIn(true);
                })
                .catch(() => setToken(""));
        }, 20_000);

        return () => clearInterval(interval);
    }, []);

    if (token.length > 0 && !isLoggedIn) return <></>;

    return isLoggedIn ? (
        <RouterProvider router={dashboardRouter} />
    ) : (
        <RouterProvider router={loginRouter} />
    );
};
