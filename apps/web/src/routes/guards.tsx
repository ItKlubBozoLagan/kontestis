import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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

const ORGANISATION_PARAM = "org";

/**
 * Ensures an organisation is selected and keeps it in the address bar as `?org=<id>`, so any
 * copied URL opens in the right organisation for whoever receives it. A fresh navigation with
 * `?org=` (or the legacy `?organisationId=`) switches organisation; switching it in the UI
 * rewrites the parameter. Temporary users are pinned to their organisation.
 */
export const RequireOrganisation = () => {
    const token = useSessionStore((state) => state.token);
    const { data: user } = useQuery(authQueries.me(token));
    const { organisationId, select } = useOrganisationStore();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const seenLocation = useRef<string | undefined>(undefined);

    const raw = params.get(ORGANISATION_PARAM) ?? params.get("organisationId");
    const requested = raw && /^\d+$/.test(raw) ? raw : undefined;
    const temporaryOrganisation = user?.is_temporary
        ? user.temporary_data?.organisation_id.toString()
        : undefined;

    useEffect(() => {
        const fresh = seenLocation.current !== location.key;

        seenLocation.current = location.key;

        if (temporaryOrganisation) {
            if (organisationId !== temporaryOrganisation) select(temporaryOrganisation);

            return;
        }

        // read the store directly: under StrictMode this effect runs twice with a stale closure
        const selected = useOrganisationStore.getState().organisationId;

        // a link that names an organisation wins over the remembered one
        if (fresh && requested && requested !== selected) {
            select(requested);

            return;
        }

        if (
            selected &&
            (params.get(ORGANISATION_PARAM) !== selected || params.has("organisationId"))
        ) {
            const next = new URLSearchParams(params);

            next.delete("organisationId");
            next.set(ORGANISATION_PARAM, selected);
            setParams(next, { replace: true, state: location.state });
        }
    }, [
        temporaryOrganisation,
        organisationId,
        requested,
        select,
        params,
        setParams,
        location.key,
        location.state,
    ]);

    if (temporaryOrganisation) {
        if (organisationId !== temporaryOrganisation) return <FullPageSpinner />;

        return <AppShell temporary />;
    }

    if (!organisationId) {
        if (requested) return <FullPageSpinner />;

        return (
            <Navigate
                to={`/organisations?redirect=${encodeURIComponent(currentPath(location))}`}
                replace
            />
        );
    }

    // never render (and fetch) a linked page under the previously selected organisation
    if (requested && requested !== organisationId && seenLocation.current !== location.key)
        return <FullPageSpinner />;

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
