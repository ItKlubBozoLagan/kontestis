import { FullUser, Snowflake } from "@kontestis/models";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate, useRoutes } from "react-router-dom";

import { http, wrapAxios } from "@/api/http";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n";
import { dashboardRoutes } from "@/routes/dashboard";
import { loginRoutes } from "@/routes/login";
import { organisationRoutes } from "@/routes/organisation";
import { useAuthStore, useOrganisationStore, useTokenStore } from "@/store";

export default function App() {
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

    // Clear cache on organisation change
    useEffect(() => {
        queryClient.clear();
    }, [organisationId, queryClient]);

    // Handle BigInt organisation ID
    useEffect(() => {
        const _organisationId = organisationId as Snowflake | string;

        if (typeof _organisationId === "string") {
            setOrganisationId(BigInt(/^\d+$/.test(_organisationId) ? _organisationId : "0"));
        }
    }, [organisationId, setOrganisationId]);

    // Auth check on token change
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
    }, [token, setUser, setIsLoggedIn, resetOrganisationStore, queryClient, doForceLogout]);

    // Determine which routes to use
    const routes = isLoggedIn ? (isSelected ? dashboardRoutes : organisationRoutes) : loginRoutes;

    const matched = useRoutes(routes);

    // Handle force logout
    useEffect(() => {
        if (!forceLogout || location.pathname === "/") return;

        const path = location.pathname;
        const orgId = organisationId;

        setTimeout(() => {
            navigate(
                `/?afterLogin=${encodeURIComponent(path)}&organisationId=${
                    orgId === 0n ? 1 : orgId
                }`
            );
        });

        doForceLogout(false);
    }, [location, forceLogout, organisationId, navigate, doForceLogout]);

    // Handle after login redirect
    useEffect(() => {
        if (!isLoggedIn) return;

        const search = new URLSearchParams(location.search);

        if (search.has("organisationId")) {
            setOrganisationId(BigInt(search.get("organisationId") ?? "1"));
            setIsOrganisationSelected(true);

            if (search.has("afterLogin")) {
                navigate(decodeURIComponent(search.get("afterLogin") ?? "/"));
            }
        }
    }, [isLoggedIn, location.search, setOrganisationId, setIsOrganisationSelected, navigate]);

    return (
        <LanguageProvider>
            <ThemeProvider defaultTheme="system" storageKey="kontestis-ui-theme">
                <TooltipProvider>
                    <div className="min-h-screen bg-background font-sans antialiased">
                        {matched}
                    </div>
                </TooltipProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
}
