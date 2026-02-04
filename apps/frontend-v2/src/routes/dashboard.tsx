import { Navigate, RouteObject } from "react-router-dom";

import { RootLayout } from "@/components/layout";
import { AccountPage } from "@/pages/account/account-page";
import { ContestViewPage } from "@/pages/contests/contest-view-page";
import { ContestsPage } from "@/pages/contests/contests-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { ProblemViewPage } from "@/pages/problems/problem-view-page";
import { ProblemsPage } from "@/pages/problems/problems-page";
import { SubmissionViewPage } from "@/pages/submissions/submission-view-page";

export const dashboardRoutes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            {
                path: "contests",
                element: <ContestsPage />,
            },
            {
                path: "contest/:contestId",
                element: <ContestViewPage />,
            },
            {
                path: "problems",
                element: <ProblemsPage />,
            },
            {
                path: "problem/:problemId",
                element: <ProblemViewPage />,
            },
            {
                path: "submission/:submissionId",
                element: <SubmissionViewPage />,
            },
            {
                path: "account",
                element: <AccountPage />,
            },
            {
                path: "*",
                element: <Navigate to="/" replace />,
            },
        ],
    },
];
