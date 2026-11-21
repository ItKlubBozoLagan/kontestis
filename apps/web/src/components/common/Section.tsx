import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
    title?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

/** Titled, bordered panel — the modern take on the old `TitledSection`. */
export const Section = ({
    title,
    icon: Icon,
    actions,
    children,
    className,
    contentClassName,
}: Props) => (
    <section className={cn("bg-card w-full overflow-hidden rounded-md border", className)}>
        {(title || actions) && (
            <header className="bg-muted/70 flex min-h-11 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
                <h2 className="flex items-center gap-2 text-base font-medium">
                    {Icon && <Icon className="text-muted-foreground size-4" />}
                    {title}
                </h2>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </header>
        )}
        <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
);
