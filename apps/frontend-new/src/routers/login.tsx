import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { LoginPage } from "../pages/auth/login/LoginPage";
import { Root } from "../pages/Root";

export const loginRoutes: RouteObject[] = [
    {
        path: "/",
        element: <Root />,
        children: [
            {
                index: true,
                element: <LoginPage />,
            },
            // {
            //     path: "register",
            //     element: <RegisterPage />,
            // },
            // {
            //     path: "aai-login",
            //     element: <AaiLoginPage />,
            // },
            {
                path: "*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
];
