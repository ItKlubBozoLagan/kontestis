import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAaiEduToken } from "@/api/auth";

export function AaiLoginPage() {
    const navigate = useNavigate();
    const [searchParameters] = useSearchParams();
    const aaiTokenMutation = useAaiEduToken();

    useEffect(() => {
        const code = searchParameters.get("code");
        const state = searchParameters.get("state");

        if (!code || !state || state !== "login") {
            navigate("/");

            return;
        }

        aaiTokenMutation.mutate(
            { authorization_code: code },
            {
                onError: () => {
                    navigate("/");
                },
            }
        );
    }, [searchParameters, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
