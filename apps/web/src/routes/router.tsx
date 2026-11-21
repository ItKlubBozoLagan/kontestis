import { createBrowserRouter, Navigate, type RouteObject, useParams } from "react-router";

import { FullPageSpinner } from "@/components/common/Spinner";
import { CenteredShell } from "@/components/layout/AppShell";
import { GuestOnly, NotTemporary, RequireAuth, RequireOrganisation } from "@/routes/guards";
import { RootLayout } from "@/routes/RootLayout";

type PageModule = Record<string, React.ComponentType>;

/** Route-level code splitting: `page(() => import("..."), "ExportName")`. */
const page =
    (load: () => Promise<PageModule>, name: string): RouteObject["lazy"] =>
    async () => ({ Component: (await load())[name] });

const RedirectWithParams = ({
    to,
}: {
    to: (params: Record<string, string | undefined>) => string;
}) => {
    const params = useParams();

    return <Navigate to={to(params)} replace />;
};

const managementRoutes: RouteObject[] = [
    { index: true, element: <Navigate to="overview" replace /> },
    {
        path: "overview",
        lazy: page(
            () => import("@/features/management/overview/ContestOverviewPage"),
            "ContestOverviewPage"
        ),
    },
    {
        path: "problems",
        lazy: page(
            () => import("@/features/management/problems/ContestProblemsPage"),
            "ContestProblemsPage"
        ),
    },
    {
        path: "problems/:problemId",
        lazy: page(
            () => import("@/features/management/problems/ProblemManagePage"),
            "ProblemManagePage"
        ),
    },
    {
        path: "problems/:problemId/generators",
        lazy: page(
            () => import("@/features/management/generators/GeneratorsPage"),
            "GeneratorsPage"
        ),
    },
    {
        path: "problems/:problemId/generators/:generatorId",
        lazy: page(() => import("@/features/management/generators/GeneratorPage"), "GeneratorPage"),
    },
    {
        path: "problems/:problemId/:clusterId",
        lazy: page(() => import("@/features/management/clusters/ClusterPage"), "ClusterPage"),
    },
    {
        path: "problems/:problemId/:clusterId/:testcaseId",
        lazy: page(() => import("@/features/management/testcases/TestcasePage"), "TestcasePage"),
    },
    {
        path: "announcements",
        lazy: page(
            () => import("@/features/management/announcements/AnnouncementsPage"),
            "AnnouncementsPage"
        ),
    },
    {
        path: "questions",
        lazy: page(() => import("@/features/management/questions/QuestionsPage"), "QuestionsPage"),
    },
    {
        path: "questions/:threadId",
        lazy: page(
            () => import("@/features/management/questions/QuestionThreadPage"),
            "QuestionThreadPage"
        ),
    },
    {
        path: "participants",
        lazy: page(
            () => import("@/features/management/participants/ParticipantsPage"),
            "ParticipantsPage"
        ),
    },
    {
        path: "results",
        lazy: page(() => import("@/features/management/results/ResultsPage"), "ResultsPage"),
    },
    {
        path: "results/:userId",
        lazy: page(
            () => import("@/features/management/results/ParticipantResultsPage"),
            "ParticipantResultsPage"
        ),
    },
];

const adminRoutes: RouteObject[] = [
    { index: true, element: <Navigate to="overview" replace /> },
    {
        path: "overview",
        lazy: page(() => import("@/features/admin/AdminOverviewPage"), "AdminOverviewPage"),
    },
    {
        path: "users",
        lazy: page(() => import("@/features/admin/AdminUsersPage"), "AdminUsersPage"),
    },
    {
        path: "alerts",
        lazy: page(() => import("@/features/admin/AdminAlertsPage"), "AdminAlertsPage"),
    },
    {
        path: "contests",
        lazy: page(() => import("@/features/admin/AdminContestsPage"), "AdminContestsPage"),
    },
    {
        path: "organisations",
        lazy: page(
            () => import("@/features/admin/AdminOrganisationsPage"),
            "AdminOrganisationsPage"
        ),
    },
    { path: "mail", lazy: page(() => import("@/features/admin/AdminMailPage"), "AdminMailPage") },
];

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        HydrateFallback: FullPageSpinner,
        children: [
            {
                element: <GuestOnly />,
                children: [
                    {
                        element: <CenteredShell />,
                        children: [
                            {
                                path: "/login",
                                lazy: page(() => import("@/features/auth/LoginPage"), "LoginPage"),
                            },
                            {
                                path: "/register",
                                lazy: page(
                                    () => import("@/features/auth/RegisterPage"),
                                    "RegisterPage"
                                ),
                            },
                            {
                                path: "/temp-login",
                                lazy: page(
                                    () => import("@/features/auth/TemporaryLoginPage"),
                                    "TemporaryLoginPage"
                                ),
                            },
                        ],
                    },
                ],
            },
            {
                element: <CenteredShell />,
                children: [
                    // AAI@EduHr redirects here both for logging in and for linking an account
                    {
                        path: "/aai-login",
                        lazy: page(
                            () => import("@/features/auth/AaiCallbackPage"),
                            "AaiCallbackPage"
                        ),
                    },
                ],
            },
            {
                element: <RequireAuth />,
                children: [
                    {
                        element: <NotTemporary />,
                        children: [
                            {
                                element: <CenteredShell />,
                                children: [
                                    {
                                        path: "/organisations",
                                        lazy: page(
                                            () =>
                                                import(
                                                    "@/features/organisations/OrganisationSelectPage"
                                                ),
                                            "OrganisationSelectPage"
                                        ),
                                    },
                                    // authorization requests from external applications
                                    {
                                        path: "/oauth/authorize",
                                        lazy: page(
                                            () => import("@/features/oauth/OAuthAuthorizePage"),
                                            "OAuthAuthorizePage"
                                        ),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        element: <RequireOrganisation />,
                        children: [
                            {
                                index: true,
                                lazy: page(
                                    () => import("@/features/dashboard/HomePage"),
                                    "HomePage"
                                ),
                            },
                            {
                                path: "contest/:contestId",
                                lazy: page(
                                    () => import("@/features/contests/ContestPage"),
                                    "ContestPage"
                                ),
                            },
                            {
                                path: "contest/:contestId/thread/:threadId",
                                lazy: page(
                                    () => import("@/features/contests/ContestThreadPage"),
                                    "ContestThreadPage"
                                ),
                            },
                            {
                                path: "problem/:problemId",
                                lazy: page(
                                    () => import("@/features/problems/ProblemPage"),
                                    "ProblemPage"
                                ),
                            },
                            {
                                path: "submission/:submissionId",
                                lazy: page(
                                    () => import("@/features/submissions/SubmissionPage"),
                                    "SubmissionPage"
                                ),
                            },
                            {
                                element: <NotTemporary />,
                                children: [
                                    {
                                        path: "contests",
                                        lazy: page(
                                            () => import("@/features/contests/ContestsPage"),
                                            "ContestsPage"
                                        ),
                                    },
                                    {
                                        path: "problems",
                                        lazy: page(
                                            () => import("@/features/problems/ProblemsPage"),
                                            "ProblemsPage"
                                        ),
                                    },
                                    {
                                        path: "account",
                                        lazy: page(
                                            () => import("@/features/account/AccountPage"),
                                            "AccountPage"
                                        ),
                                    },
                                    {
                                        path: "organisations/:organisationId",
                                        lazy: page(
                                            () =>
                                                import(
                                                    "@/features/organisations/OrganisationManagePage"
                                                ),
                                            "OrganisationManagePage"
                                        ),
                                    },
                                    {
                                        path: "manage/:organisationId",
                                        element: (
                                            <RedirectWithParams
                                                to={(p) => `/organisations/${p.organisationId}`}
                                            />
                                        ),
                                    },
                                    {
                                        path: "review/:finalSubmissionId",
                                        lazy: page(
                                            () =>
                                                import(
                                                    "@/features/management/results/FinalSubmissionReviewPage"
                                                ),
                                            "FinalSubmissionReviewPage"
                                        ),
                                    },
                                    {
                                        path: "management",
                                        lazy: page(
                                            () => import("@/features/management/ManagementPage"),
                                            "ManagementPage"
                                        ),
                                    },
                                    {
                                        path: "management/:contestId",
                                        lazy: page(
                                            () =>
                                                import(
                                                    "@/features/management/ContestManagementLayout"
                                                ),
                                            "ContestManagementLayout"
                                        ),
                                        children: managementRoutes,
                                    },
                                    {
                                        path: "admin",
                                        lazy: page(
                                            () => import("@/features/admin/AdminLayout"),
                                            "AdminLayout"
                                        ),
                                        children: adminRoutes,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            { path: "*", element: <Navigate to="/" replace /> },
        ],
    },
]);
