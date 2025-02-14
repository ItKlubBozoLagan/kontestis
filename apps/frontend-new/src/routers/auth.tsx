import React from "react";
import { Navigate, RouteObject } from "react-router-dom";

import { LoginPage } from "@/pages/auth/login/LoginPage";
import { RegisterPage } from "@/pages/auth/register/RegisterPage";
import { Root } from "@/pages/Root";

export const authRoutes: RouteObject[] = [
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
