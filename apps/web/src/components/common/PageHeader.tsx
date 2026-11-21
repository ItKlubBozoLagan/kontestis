import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
};

/** Page title with the underline rule used throughout Kontestis. */
export const PageHeader = ({ title, description, actions, className }: Props) => (
    <div
        className={cn(
            "flex w-full flex-wrap items-end justify-between gap-4 border-b-2 border-neutral-400 pb-2 dark:border-neutral-600",
            className
        )}
    >
        <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-normal tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
);
