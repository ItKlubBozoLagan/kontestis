import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { AccountPage } from "../pages/account/AccountPage";
import { AdminPageLayout } from "../pages/admin/AdminPageLayout";
import { AdminAlertsPage } from "../pages/admin/alerts/AdminAlertsPage";
import { AdminContestsPage } from "../pages/admin/contests/AdminContestsPage";
import { AdminMailPage } from "../pages/admin/mail/AdminMailPage";
import { AdminOrganisationsPage } from "../pages/admin/organisations/AdminOrganisationsPage";
import { AdminOverviewPage } from "../pages/admin/overview/AdminOverviewPage";
import { AdminUsersPage } from "../pages/admin/users/AdminUsersPage";
import { AaiLinkPage } from "../pages/auth/AaiLinkPage";
import { ContestsPage } from "../pages/contests/ContestsPage";
import { ContestViewPage } from "../pages/contests/ContestViewPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ContestAnnouncementsPage } from "../pages/management/contest/announcements/ContestAnnouncementsPage";
import { ContestManagementLayout } from "../pages/management/contest/ContestManagementLayout";
import { ContestOverviewPage } from "../pages/management/contest/overview/ContestOverviewPage";
import { ContestParticipantsPage } from "../pages/management/contest/participants/ContestParticipantsPage";
import { ContestClusterManagePage } from "../pages/management/contest/problems/clusters/ContestClusterManagePage";
import { ContestTestcaseManagePage } from "../pages/management/contest/problems/clusters/testcases/ContestTestcaseManagePage";
import { ContestProblemManagePage } from "../pages/management/contest/problems/ContestProblemManagePage";
import { ContestProblemsPage } from "../pages/management/contest/problems/ContestProblemsPage";
import { GeneratorDetailPage } from "../pages/management/contest/problems/generators/GeneratorDetailPage";
import { GeneratorManagePage } from "../pages/management/contest/problems/generators/GeneratorManagePage";
import { ContestQuestionsPage } from "../pages/management/contest/questions/ContestQuestionsPage";
import { ContestResultsPage } from "../pages/management/contest/results/ContestResultsPage";
import { FinalSubmissionReviewPage } from "../pages/management/contest/results/FinalSubmissionReviewPage";
import { FinalSubmissionsPage } from "../pages/management/contest/results/FinalSubmissionsPage";
import { ManagementPage } from "../pages/management/ManagementPage";
import { OrganisationManagementPage } from "../pages/organisation/management/OrganisationManagementPage";
import { ProblemsPage } from "../pages/problems/ProblemsPage";
import { ProblemViewPage } from "../pages/problems/ProblemViewPage";
import { Root } from "../pages/Root";
import { SubmissionViewPage } from "../pages/submissions/SubmissionViewPage";

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
                path: "submission/:submissionId",
                element: <SubmissionViewPage />,
            },
            {
                path: "problem/:problemId",
                element: <ProblemViewPage />,
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
                path: "contests",
                element: <ContestsPage />,
            },
            {
                path: "account",
                element: <AccountPage />,
            },
            {
                path: "review/:final_submission_id",
                element: <FinalSubmissionReviewPage />,
            },
            {
                path: "manage/:organisationId",
                element: <OrganisationManagementPage />,
            },
            {
                path: "admin",
                element: <AdminPageLayout />,
                children: [
                    {
                        path: "overview",
                        element: <AdminOverviewPage />,
                    },
                    {
                        path: "users",
                        element: <AdminUsersPage />,
                    },
                    {
                        path: "alerts",
                        element: <AdminAlertsPage />,
                    },
                    {
                        path: "contests",
                        element: <AdminContestsPage />,
                    },
                    {
                        path: "organisations",
                        element: <AdminOrganisationsPage />,
                    },
                    {
                        path: "mail",
                        element: <AdminMailPage />,
                    },
                ],
            },
            {
                path: "management",
                element: <ManagementPage />,
            },
            {
                path: "management/:contestId",
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
                        path: "problems/:problemId",
                        element: <ContestProblemManagePage />,
                    },
                    {
                        path: "problems/:problemId/generators",
                        element: <GeneratorManagePage />,
                    },
                    {
                        path: "problems/:problemId/generators/:generatorId",
                        element: <GeneratorDetailPage />,
                    },
                    {
                        path: "problems/:problemId/:clusterId",
                        element: <ContestClusterManagePage />,
                    },
                    {
                        path: "problems/:problemId/:clusterId/:testcaseId",
                        element: <ContestTestcaseManagePage />,
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
                        path: "results",
                        element: <ContestResultsPage />,
                    },
                    {
                        path: "results/:user_id",
                        element: <FinalSubmissionsPage />,
                    },
                    {
                        index: true,
                        element: <Navigate to={"overview"} replace />,
                    },
                ],
            },
            {
                path: "*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
    {
        path: "/aai-login",
        element: <AaiLinkPage />,
    },
];
