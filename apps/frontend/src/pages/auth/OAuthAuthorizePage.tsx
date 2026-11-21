import { FC, useMemo } from "react";
import { Navigate, useLocation } from "react-router";
import { useSearchParams } from "react-router-dom";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledSection } from "../../components/TitledSection";
import { Translated } from "../../components/Translated";
import { useOAuthAuthorize } from "../../hooks/oauth/useOAuthAuthorize";
import { useOAuthClient } from "../../hooks/oauth/useOAuthClient";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { useTokenStore } from "../../state/token";
import { rememberOAuthReturn } from "../../util/oauthReturn";

// Logged-out visitors log in first and come back here afterwards.
export const OAuthLoginRedirect: FC = () => {
    const location = useLocation();
    const path = location.pathname + location.search;

    rememberOAuthReturn(path);

    return <Navigate to={`/?afterLogin=${encodeURIComponent(path)}`} replace />;
};

export const OAuthAuthorizePage: FC = () => {
    const [parameters] = useSearchParams();
    const location = useLocation();

    const clientId = parameters.get("client_id") ?? "";
    const redirectUri = parameters.get("redirect_uri") ?? "";
    const state = parameters.get("state") ?? undefined;
    const responseType = parameters.get("response_type") ?? "code";

    const valid = clientId.length > 0 && redirectUri.length > 0 && responseType === "code";

    const { user } = useAuthStore();
    const { setToken } = useTokenStore();

    const { t } = useTranslation();

    const client = useOAuthClient({ clientId, redirectUri }, { enabled: valid });

    const authorize = useOAuthAuthorize({
        onSuccess: (data) => window.location.assign(data.redirect),
    });

    // only meaningful once the redirect URI is known to belong to the client
    const deniedUrl = useMemo(() => {
        if (!client.isSuccess) return null;

        const url = new URL(redirectUri);

        url.searchParams.set("error", "access_denied");

        if (state !== undefined) url.searchParams.set("state", state);

        return url.toString();
    }, [client.isSuccess, redirectUri, state]);

    if (valid && client.isLoading) return <LoadingSpinner size={"lg"} />;

    return (
        <div tw={"w-full md:max-w-[640px] mt-20"}>
            {!valid || !client.isSuccess ? (
                <TitledSection title={t("oauth.authorize.invalidTitle")}>
                    <span tw={"py-6 text-lg text-center"}>
                        {t("oauth.authorize.invalidDescription")}
                    </span>
                </TitledSection>
            ) : (
                <TitledSection title={t("oauth.authorize.title")}>
                    <div tw={"w-full flex flex-col items-center gap-6 py-6"}>
                        <span tw={"text-lg text-center"}>
                            <Translated translationKey={"oauth.authorize.description"}>
                                <b>{client.data.name}</b>
                                <b>{user.full_name}</b>
                                {user.email}
                            </Translated>
                        </span>
                        {authorize.isError && (
                            <span tw={"text-red-500"}>{authorize.error.message}</span>
                        )}
                        <div tw={"flex gap-4"}>
                            <SimpleButton
                                disabled={authorize.isLoading || authorize.isSuccess}
                                onClick={() =>
                                    authorize.mutate({
                                        client_id: clientId,
                                        redirect_uri: redirectUri,
                                        state,
                                    })
                                }
                            >
                                {t("oauth.authorize.continue")}
                            </SimpleButton>
                            <SimpleButton
                                disabled={authorize.isLoading || authorize.isSuccess}
                                onClick={() => deniedUrl && window.location.assign(deniedUrl)}
                            >
                                {t("oauth.authorize.cancel")}
                            </SimpleButton>
                        </div>
                        <button
                            tw={"text-sm underline cursor-pointer"}
                            onClick={() => {
                                rememberOAuthReturn(location.pathname + location.search);
                                setToken("");
                            }}
                        >
                            {t("oauth.authorize.switchAccount")}
                        </button>
                    </div>
                </TitledSection>
            )}
        </div>
    );
};
