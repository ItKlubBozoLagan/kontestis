import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { OrganisationManagementPage } from "../pages/organisation/management/OrganisationManagementPage";
import { OrganisationPage } from "../pages/organisation/OrganisationPage";
import { Root } from "../pages/Root";

export const organisationRoutes: RouteObject[] = [
    {
        path: "/",
        element: <Root hideNavbar />,
        children: [
            {
                index: true,
                element: <OrganisationPage />,
            },
            {
                path: "manage/:organisationId",
                element: <OrganisationManagementPage />,
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to={"/"} replace />,
    },
];
