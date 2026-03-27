import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { ContestThreadPage } from "../pages/contests/ContestThreadPage";
import { ContestViewPage } from "../pages/contests/ContestViewPage";
import { ProblemViewPage } from "../pages/problems/ProblemViewPage";
import { SubmissionViewPage } from "../pages/submissions/SubmissionViewPage";
import { TemporaryContestsPage } from "../pages/temporary/TemporaryContestsPage";
import { TemporaryLayout } from "../pages/temporary/TemporaryLayout";

export const temporaryRoutes: RouteObject[] = [
    {
        path: "/",
        element: <TemporaryLayout />,
        children: [
            {
                index: true,
                element: <TemporaryContestsPage />,
            },
            {
                path: "contest/:contestId",
                element: <ContestViewPage />,
            },
            {
                path: "contest/:contestId/thread/:threadId",
                element: <ContestThreadPage />,
            },
            {
                path: "submission/:submissionId",
                element: <SubmissionViewPage />,
            },
            {
                path: "problem/:problemId",
                element: <ProblemViewPage />,
            },
            {
                path: "*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
];
