import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router";

import { ErrorView } from "@/components/common/ErrorView";
import { PageSkeleton } from "@/components/common/PageSkeleton";

/**
 * Suspense + error boundary pair for suspense queries. Resets on navigation and when the user
 * presses "try again" (which also resets failed queries).
 */
export const AsyncBoundary = ({
    children,
    fallback = <PageSkeleton />,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) => {
    const location = useLocation();

    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary
                    onReset={reset}
                    resetKeys={[location.pathname]}
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorView error={error} onRetry={resetErrorBoundary} />
                    )}
                >
                    <Suspense fallback={fallback}>{children}</Suspense>
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
};
