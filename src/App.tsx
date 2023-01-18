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

const router = createBrowserRouter([
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
                path: "/register",
                element: <AuthUser register={true} />,
            },
            {
                path: "/login",
                element: <AuthUser register={false} />,
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

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
