import { Navigate, RouteObject } from "react-router-dom";

import { RootLayout } from "@/components/layout";
import { AaiLoginPage } from "@/pages/auth/aai-login-page";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";

export const loginRoutes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout hideNavbar />,
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
                path: "*",
                element: <Navigate to="/" replace />,
            },
        ],
    },
];
