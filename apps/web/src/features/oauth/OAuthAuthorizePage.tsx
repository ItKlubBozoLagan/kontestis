import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { oauthQueries, useOAuthAuthorize } from "@/api/oauth";
import { Alert } from "@/components/common/Alert";
import { FullPageSpinner } from "@/components/common/Spinner";
import { UserAvatar } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/AuthCard";
import { useSessionStore } from "@/stores/session";

/**
 * Authorization request from a trusted external application (OAuth 2.0 authorization code flow,
 * see apps/backend/src/routes/oauth). Logged out visitors are sent through the login page by
 * `RequireAuth` and come back here afterwards.
 */
export const OAuthAuthorizePage = () => {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const user = useCurrentUser();
    const queryClient = useQueryClient();
    const logout = useSessionStore((state) => state.logout);

    const clientId = params.get("client_id") ?? "";
    const redirectUri = params.get("redirect_uri") ?? "";
    const state = params.get("state") ?? undefined;
    const responseType = params.get("response_type") ?? "code";

    const valid = clientId.length > 0 && redirectUri.length > 0 && responseType === "code";

    const client = useQuery({ ...oauthQueries.client(clientId, redirectUri), enabled: valid });
    const authorize = useOAuthAuthorize();

    // only meaningful once the redirect URI is known to belong to the client
    const deniedUrl = useMemo(() => {
        if (!client.isSuccess) return null;

        const url = new URL(redirectUri);

        url.searchParams.set("error", "access_denied");

        if (state !== undefined) url.searchParams.set("state", state);

        return url.toString();
    }, [client.isSuccess, redirectUri, state]);

    if (valid && client.isPending) return <FullPageSpinner />;

    if (!valid || !client.isSuccess)
        return (
            <AuthCard title={t("oauth.authorize.invalidTitle")}>
                <p className="text-muted-foreground py-4 text-center">
                    {t("oauth.authorize.invalidDescription")}
                </p>
            </AuthCard>
        );

    const busy = authorize.isPending || authorize.isSuccess;

    return (
        <AuthCard title={t("oauth.authorize.title")}>
            <div className="flex flex-col items-center gap-6 py-4">
                <div className="flex items-center gap-3">
                    <UserAvatar name={user.full_name} src={user.picture_url} className="size-12" />
                    <div className="flex flex-col">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-muted-foreground text-sm">{user.email}</span>
                    </div>
                </div>
                <p className="text-center">
                    <Trans
                        i18nKey="oauth.authorize.description"
                        values={{ client: client.data.name }}
                        components={{ b: <b /> }}
                    />
                </p>
                {authorize.isError && (
                    <Alert variant="destructive" icon={CircleAlert} className="w-full">
                        {authorize.error.message}
                    </Alert>
                )}
                <div className="flex gap-3">
                    <Button
                        disabled={busy}
                        onClick={() =>
                            authorize.mutate(
                                { client_id: clientId, redirect_uri: redirectUri, state },
                                { onSuccess: ({ redirect }) => window.location.assign(redirect) }
                            )
                        }
                    >
                        {t("oauth.authorize.continue")}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => deniedUrl && window.location.assign(deniedUrl)}
                    >
                        {t("oauth.authorize.cancel")}
                    </Button>
                </div>
                <Button
                    variant="link"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                        // RequireAuth then sends the visitor to the login page and back here
                        logout();
                        queryClient.clear();
                    }}
                >
                    {t("oauth.authorize.switchAccount")}
                </Button>
            </div>
        </AuthCard>
    );
};
