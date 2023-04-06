import "twin.macro";
import "./globals.scss";

import { FullUser } from "@kontestis/models";
import React, { useEffect } from "react";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { useLocation, useNavigate } from "react-router";
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
    const { isLoggedIn, setUser, setIsLoggedIn, forceLogout, doForceLogout } = useAuthStore();
    const { token } = useTokenStore();
    const {
        isSelected,
        organisationId,
        setOrganisationId,
        setIsSelected: setIsOrganisationSelected,
        reset: resetOrganisationStore,
    } = useOrganisationStore();

    const queryClient = useQueryClient();

    const location = useLocation();
    const navigate = useNavigate();

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
            .catch(() => doForceLogout());
    }, [token]);

    const matched = useRoutes(
        isLoggedIn ? (isSelected ? dashboardRoutes : organisationRoutes) : loginRoutes
    );

    useEffect(() => {
        if (!forceLogout || location.pathname === "/") return;

        const path = location.pathname;
        const orgId = organisationId;

        // next tick
        setTimeout(() => {
            navigate(
                `/?afterLogin=${encodeURIComponent(path)}&organisationId=${
                    orgId === 0n ? 1 : orgId
                }`
            );
        });

        doForceLogout(false);
    }, [location, forceLogout]);

    useEffect(() => {
        if (!isLoggedIn) return;

        const search = new URLSearchParams(location.search);

        if (search.has("organisationId")) {
            setOrganisationId(BigInt(search.get("organisationId") ?? "1"));
            setIsOrganisationSelected(true);
        }

        if (search.has("afterLogin")) {
            const where = search.get("afterLogin")!;

            // trigger next tick
            setTimeout(() => {
                navigate(where);
            });
        }
    }, [isLoggedIn, location]);

    if (token.length > 0 && !isLoggedIn) return <></>;

    return matched;
};
