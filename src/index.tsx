import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Dashboard from "./pages/Dashboard";

const root = ReactDOM.createRoot(
    document.querySelector("#root") as HTMLElement
);

const router = createBrowserRouter([
    {
        path: "/",
        element: <Dashboard />,
    },
]);

root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
