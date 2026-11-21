import { Outlet } from "react-router";

import { AsyncBoundary } from "@/components/common/AsyncBoundary";
import { Navbar } from "@/components/layout/Navbar";

export const AppShell = ({ temporary = false }: { temporary?: boolean }) => (
    <div className="flex min-h-svh flex-col">
        <Navbar temporary={temporary} />
        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            <AsyncBoundary>
                <Outlet />
            </AsyncBoundary>
        </main>
    </div>
);

export const CenteredShell = () => (
    <div className="relative flex min-h-svh flex-col items-center px-4 py-10 sm:py-16">
        <main className="flex w-full max-w-3xl flex-col gap-6">
            <AsyncBoundary>
                <Outlet />
            </AsyncBoundary>
        </main>
    </div>
);
