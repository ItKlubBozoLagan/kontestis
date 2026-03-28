import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { AaiLoginPage } from "../pages/auth/AaiLoginPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { TemporaryLoginPage } from "../pages/auth/TemporaryLoginPage";
import { Root } from "../pages/Root";

export const loginRoutes: RouteObject[] = [
    {
        path: "/",
        element: <Root hideNavbar />,
        children: [
            {
                index: true,
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "aai-login",
                element: <AaiLoginPage />,
            },
            {
                path: "temp-login",
                element: <TemporaryLoginPage />,
            },
            {
                path: "*",
                element: <Navigate to={"/"} replace />,
            },
        ],
    },
];
