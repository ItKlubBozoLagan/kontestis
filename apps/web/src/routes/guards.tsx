import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router";

import { authQueries } from "@/api/auth";
import { organisationQueries } from "@/api/organisations";
import { ErrorView } from "@/components/common/ErrorView";
import { FullPageSpinner } from "@/components/common/Spinner";
import { AppShell } from "@/components/layout/AppShell";
import { useOrganisationStore } from "@/stores/organisation";
import { useSessionStore } from "@/stores/session";

const currentPath = (location: { pathname: string; search: string }) =>
    location.pathname + location.search;

/** Only for logged out visitors; logged in users continue to `?redirect=` or the dashboard. */
export const GuestOnly = () => {
    const token = useSessionStore((state) => state.token);
    const [params] = useSearchParams();

    if (token) return <Navigate to={params.get("redirect") ?? "/"} replace />;

    return <Outlet />;
};

/** Requires a valid session and loads the current user before rendering children. */
export const RequireAuth = () => {
    const token = useSessionStore((state) => state.token);
    const location = useLocation();
    const { data: user, error, refetch } = useQuery(authQueries.me(token));

    if (!token)
        return (
            <Navigate
                to={
                    location.pathname === "/"
                        ? // keeps e.g. ?confirmed=true from the email confirmation redirect
                          `/login${location.search}`
                        : `/login?redirect=${encodeURIComponent(currentPath(location))}`
                }
                replace
            />
        );

    if (error) return <ErrorView error={error} onRetry={() => refetch()} />;

    if (!user) return <FullPageSpinner />;

    return <Outlet />;
};

/**
 * Ensures an organisation is selected. Temporary users are pinned to their organisation; links
 * may carry `?organisationId=` to switch organisation before opening the page.
 */
export const RequireOrganisation = () => {
    const token = useSessionStore((state) => state.token);
    const { data: user } = useQuery(authQueries.me(token));
    const { organisationId, select } = useOrganisationStore();
    const location = useLocation();
    const [params, setParams] = useSearchParams();

    const requested = params.get("organisationId");
    const temporaryOrganisation = user?.is_temporary
        ? user.temporary_data?.organisation_id.toString()
        : undefined;

    useEffect(() => {
        if (temporaryOrganisation && organisationId !== temporaryOrganisation) {
            select(temporaryOrganisation);

            return;
        }

        if (requested && /^\d+$/.test(requested)) {
            select(requested);
            params.delete("organisationId");
            setParams(params, { replace: true });
        }
    }, [temporaryOrganisation, organisationId, requested, select, params, setParams]);

    if (temporaryOrganisation) {
        if (organisationId !== temporaryOrganisation) return <FullPageSpinner />;

        return <AppShell temporary />;
    }

    if (requested) return <FullPageSpinner />;

    if (!organisationId)
        return (
            <Navigate
                to={`/organisations?redirect=${encodeURIComponent(currentPath(location))}`}
                replace
            />
        );

    return <AppShell />;
};

/** Hides routes from temporary (contest-locked) accounts. */
export const NotTemporary = () => {
    const token = useSessionStore((state) => state.token);
    const { data: user } = useQuery(authQueries.me(token));

    if (user?.is_temporary) return <Navigate to="/" replace />;

    return <Outlet />;
};

/** Clears organisation scoped cache whenever the selected organisation changes. */
export const useOrganisationCacheReset = () => {
    const queryClient = useQueryClient();

    useEffect(
        () =>
            useOrganisationStore.subscribe((state, previous) => {
                if (state.organisationId === previous.organisationId) return;

                queryClient.removeQueries({
                    predicate: (query) =>
                        query.queryKey[0] !== "auth" &&
                        query.queryKey[0] !== organisationQueries.all().queryKey[0],
                });
            }),
        [queryClient]
    );
};
