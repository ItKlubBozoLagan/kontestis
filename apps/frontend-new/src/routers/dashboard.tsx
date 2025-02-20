import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { Root } from "@/pages/Root";

export const dashboardRoutes: RouteObject[] = [
    {
        path: "/",
        element: <Root />,
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            {
                path: "*",
                element: <Navigate to={"/"} replace />,
            },
        ],
        // children: [
        //     {
        //         index: true,
        //         element: <DashboardPage />,
        //     },
        //     {
        //         path: "submission/:submissionId",
        //         element: <SubmissionViewPage />,
        //     },
        //     {
        //         path: "problem/:problemId",
        //         element: <ProblemViewPage />,
        //     },
        //     {
        //         path: "contest/:contestId",
        //         element: <ContestViewPage />,
        //     },
        //     {
        //         path: "problems",
        //         element: <ProblemsPage />,
        //     },
        //     {
        //         path: "contests",
        //         element: <ContestsPage />,
        //     },
        //     {
        //         path: "account",
        //         element: <AccountPage />,
        //     },
        //     {
        //         path: "review/:final_submission_id",
        //         element: <FinalSubmissionReviewPage />,
        //     },
        //     {
        //         path: "manage/:organisationId",
        //         element: <OrganisationManagementPage />,
        //     },
        //     {
        //         path: "admin",
        //         element: <AdminPageLayout />,
        //         children: [
        //             {
        //                 path: "overview",
        //                 element: <AdminOverviewPage />,
        //             },
        //             {
        //                 path: "users",
        //                 element: <AdminUsersPage />,
        //             },
        //             {
        //                 path: "alerts",
        //                 element: <AdminAlertsPage />,
        //             },
        //             {
        //                 path: "contests",
        //                 element: <AdminContestsPage />,
        //             },
        //             {
        //                 path: "organisations",
        //                 element: <AdminOrganisationsPage />,
        //             },
        //             {
        //                 path: "mail",
        //                 element: <AdminMailPage />,
        //             },
        //         ],
        //     },
        //     {
        //         path: "management",
        //         element: <ManagementPage />,
        //     },
        //     {
        //         path: "management/:contestId",
        //         element: <ContestManagementLayout />,
        //         children: [
        //             {
        //                 path: "overview",
        //                 element: <ContestOverviewPage />,
        //             },
        //             {
        //                 path: "problems",
        //                 element: <ContestProblemsPage />,
        //             },
        //             {
        //                 path: "problems/:problemId",
        //                 element: <ContestProblemManagePage />,
        //             },
        //             {
        //                 path: "problems/:problemId/:clusterId",
        //                 element: <ContestClusterManagePage />,
        //             },
        //             {
        //                 path: "problems/:problemId/:clusterId/:testcaseId",
        //                 element: <ContestTestcaseManagePage />,
        //             },
        //             {
        //                 path: "announcements",
        //                 element: <ContestAnnouncementsPage />,
        //             },
        //             {
        //                 path: "questions",
        //                 element: <ContestQuestionsPage />,
        //             },
        //             {
        //                 path: "participants",
        //                 element: <ContestParticipantsPage />,
        //             },
        //             {
        //                 path: "results",
        //                 element: <ContestResultsPage />,
        //             },
        //             {
        //                 path: "results/:user_id",
        //                 element: <FinalSubmissionsPage />,
        //             },
        //             {
        //                 index: true,
        //                 element: <Navigate to={"overview"} replace />,
        //             },
        //         ],
        //     },
        //     {
        //         path: "*",
        //         element: <Navigate to={"/"} replace />,
        //     },
        // ],
    },
    // {
    //     path: "/aai-login",
    //     element: <AaiLinkPage />,
    // },
];
