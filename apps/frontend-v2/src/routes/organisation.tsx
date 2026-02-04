import { Navigate, RouteObject } from "react-router-dom";

import { RootLayout } from "@/components/layout";
import { OrganisationSelectPage } from "@/pages/organisation/organisation-select-page";

export const organisationRoutes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout hideNavbar />,
        children: [
            {
                index: true,
                element: <OrganisationSelectPage />,
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
];
