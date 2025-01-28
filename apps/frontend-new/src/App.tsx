import "./tailwind.css";
import "./globals.scss";

import { FullUser } from "@kontestis/models";
import React, { useEffect } from "react";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { useRoutes } from "react-router-dom";

import { http, wrapAxios } from "./api/http";
import { dashboardRoutes } from "./routers/dashboard";
import { loginRoutes } from "./routers/login";
import { useAuthStore } from "./state/auth";
import { useTokenStore } from "./state/token";

Modal.setAppElement("#root");

BigInt.prototype.toJSON = function () {
    return this.toString();
};

export const App = () => {
    const { isLoggedIn, setUser, setIsLoggedIn, forceLogout, doForceLogout } = useAuthStore();
    const { token } = useTokenStore();

    const queryClient = useQueryClient();

    const { location } = window;
    // const navigate = useNavigate();

    useEffect(() => {
        if (token.length === 0) {
            setIsLoggedIn(false);
            queryClient.clear();

            return;
        }

        wrapAxios<FullUser>(http.get("/auth/info"))
            .then((data) => {
                setUser(data);

                setIsLoggedIn(true);
            })
            .catch(() => doForceLogout());
    }, [token]);

    const matched = useRoutes(isLoggedIn ? dashboardRoutes : loginRoutes);

    useEffect(() => {
        if (!forceLogout || location.pathname === "/") return;

        // const path = location.pathname;

        // next tick
        // setTimeout(() => {
        //     navigate(`/?afterLogin=${encodeURIComponent(path)}`);
        // });

        doForceLogout(false);
    }, [location, forceLogout]);

    useEffect(() => {
        // if (!isLoggedIn) return;
        // const search = new URLSearchParams(location.search);
        // if (!search.has("afterLogin")) {
        //     return;
        // }
        // const where = search.get("afterLogin")!;
        // trigger next tick
        // setTimeout(() => {
        //     navigate(where);
        // });
    }, [isLoggedIn, location]);

    if (token.length > 0 && !isLoggedIn) return <></>;

    return matched;
};
