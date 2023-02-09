import "twin.macro";
import "./globals.scss";

import { FullUser } from "@kontestis/models";
import React, { useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { http, wrapAxios } from "./api/http";
import { Account } from "./pages/account/Account";
import { LoginPage } from "./pages/auth/LoginPage";
import { Contest } from "./pages/contests/Contest";
import { Contests } from "./pages/contests/Contests";
import { Dashboard } from "./pages/Dashboard";
import { Problem } from "./pages/problems/Problem";
import { Problems } from "./pages/problems/Problems";
import { Root } from "./pages/Root";
import { Submission } from "./pages/submissions/Submission";
import { useAuthStore } from "./state/auth";

BigInt.prototype.toJSON = function () {
    return this.toString();
};

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
                path: "/submission/:submission_id",
                element: <Submission />,
            },
            {
                path: "/problem/:problem_id",
                element: <Problem />,
            },
            {
                path: "/contest/:contest_id",
                element: <Contest />,
            },
            {
                path: "/problems",
                element: <Problems />,
            },
            {
                path: "/contests",
                element: <Contests />,
            },
            {
                path: "/account",
                element: <Account />,
            },
        ],
    },
]);

const loginRouter = createBrowserRouter([
    {
        path: "/",
        element: <Root hideNavbar />,
        children: [
            {
                path: "/",
                element: <LoginPage />,
            },
            {
                path: "/oauth/callback",
                element: <div>hi</div>,
            },
            {
                path: "/*",
                element: <Navigate to={"/"} />,
            },
        ],
    },
]);

export const App = () => {
    const { isLoggedIn, token, setUser, setToken, setIsLoggedIn } = useAuthStore();

    useEffect(() => {
        if (token.length === 0) {
            setIsLoggedIn(false);

            return;
        }

        wrapAxios<FullUser>(http.get("/auth/info"))
            .then((data) => {
                setUser(data);
                setIsLoggedIn(true);
            })
            .catch(() => setToken(""));
    }, [token]);

    if (token.length > 0 && !isLoggedIn)
        // TODO: create spinner
        return <>Loading...</>;

    return <RouterProvider router={token ? dashboardRouter : loginRouter} />;
};
