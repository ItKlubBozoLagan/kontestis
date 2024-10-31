import { FC, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";

import { http, wrapAxios } from "../../api/http";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useTokenStore } from "../../state/token";

export const AaiLinkPage: FC = () => {
    const { setToken } = useTokenStore();

    const [parameters] = useSearchParams();

    const navigate = useNavigate();

    useEffect(() => {
        const code = parameters.get("code");
        const state = parameters.get("state");

        if (!code || !state || state !== "link") {
            navigate("/account");

            return;
        }

        wrapAxios<{ token: string }>(
            http.post("/auth/aai-edu/token", {
                authorization_code: code,
            })
        )
            .then((data) => setToken(data.token))
            .catch(() => {
                navigate("/account");
            });
    }, []);

    return <LoadingSpinner size={"lg"} />;
};
