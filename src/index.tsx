import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Contests } from "./pages/contests/Contests";
import Dashboard from "./pages/Dashboard";
import { Problem } from "./pages/problems/Problem";
import Problems from "./pages/problems/Problems";
import { Root } from "./pages/Root";

const root = ReactDOM.createRoot(
    document.querySelector("#root") as HTMLElement
);

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

root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
