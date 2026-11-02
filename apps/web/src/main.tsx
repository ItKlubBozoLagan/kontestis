import "@/index.css";
import "@/i18n/i18n";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { RouterProvider } from "react-router";
import { toast } from "sonner";

import { HttpError } from "@/api/http";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { i18n } from "@/i18n/i18n";
import { router } from "@/routes/router";

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 15_000,
            retry: (failureCount, error) =>
                !(error instanceof HttpError && error.status && error.status < 500) &&
                failureCount < 2,
        },
    },
    // surface mutation failures that the caller didn't handle itself
    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            if (mutation.options.onError || mutation.meta?.silent) return;

            toast.error(error.message || i18n.t("errors.generic"));
        },
    }),
});

declare module "@tanstack/react-query" {
    interface Register {
        defaultError: HttpError;
        mutationMeta: { silent?: boolean };
    }
}

createRoot(document.querySelector("#root")!).render(
    <StrictMode>
        <I18nextProvider i18n={i18n}>
            <ThemeProvider defaultTheme="light">
                <QueryClientProvider client={queryClient}>
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CLIENT_ID ?? ""}>
                        <TooltipProvider delayDuration={200}>
                            <RouterProvider router={router} />
                            <Toaster richColors closeButton position="bottom-right" />
                        </TooltipProvider>
                    </GoogleOAuthProvider>
                    <ReactQueryDevtools buttonPosition="bottom-left" />
                </QueryClientProvider>
            </ThemeProvider>
        </I18nextProvider>
    </StrictMode>
);
