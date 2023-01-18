import "twin.macro";
import "./globals.scss";

import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AuthUser from "./pages/account/AuthUser";
import { Contests } from "./pages/contests/Contests";
import Dashboard from "./pages/Dashboard";
import { Problem } from "./pages/problems/Problem";
import Problems from "./pages/problems/Problems";
import { Root } from "./pages/Root";
import { useAuthStore } from "./state/auth";

const dashboardRouter = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <Dashboard />,
            },
            {
                path: "/problem/:problem_id",
                element: <Problem />,
            },
            {
                path: "/problems",
                element: <Problems />,
            },
            {
                path: "/contests",
                element: <Contests />,
            },
        ],
    },
]);

const loginRouter = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/register",
                element: <AuthUser register={true} />,
            },
            {
                path: "/*",
                element: <AuthUser register={false} />,
            },
            {
                path: "/",
                element: <AuthUser register={false} />,
            },
        ],
    },
]);

const App = () => {
    const { token } = useAuthStore();

    return <RouterProvider router={token ? dashboardRouter : loginRouter} />;
};

export default App;
