import "twin.macro";
import "./globals.scss";

import { FullUser } from "@kontestis/models";
import React, { useEffect } from "react";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { useRoutes } from "react-router-dom";

import { http, wrapAxios } from "./api/http";
import { dashboardRoutes } from "./routers/dashboard";
import { loginRoutes } from "./routers/login";
import { organisationRoutes } from "./routers/organisation";
import { useAuthStore } from "./state/auth";
import { useOrganisationStore } from "./state/organisation";
import { useTokenStore } from "./state/token";

Modal.setAppElement("#root");

BigInt.prototype.toJSON = function () {
    return this.toString();
};

export const App = () => {
    const { isLoggedIn, setUser, setIsLoggedIn } = useAuthStore();
    const { token, setToken } = useTokenStore();
    const { isSelected, organisationId, reset: resetOrganisationStore } = useOrganisationStore();

    const queryClient = useQueryClient();

    useEffect(() => {
        queryClient.clear();
    }, [organisationId]);

    useEffect(() => {
        if (token.length === 0) {
            setIsLoggedIn(false);
            resetOrganisationStore();
            queryClient.clear();

            return;
        }

        wrapAxios<FullUser>(http.get("/auth/info"))
            .then((data) => {
                setUser(data);
                setIsLoggedIn(true);
            })
            .catch(() => setToken(""));
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (token.length === 0) return;

            wrapAxios<FullUser>(http.get("/auth/info"))
                .then((data) => {
                    setUser(data);
                    setIsLoggedIn(true);
                })
                .catch(() => setToken(""));
        }, 20_000);

        return () => clearInterval(interval);
    }, []);

    const matched = useRoutes(
        isLoggedIn ? (isSelected ? dashboardRoutes : organisationRoutes) : loginRoutes
    );

    if (token.length > 0 && !isLoggedIn) return <></>;

    return matched;
};
