import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    className?: string;
};

export const StatCard = ({ label, value, hint, icon: Icon, className }: Props) => (
    <div className={cn("bg-card flex flex-col gap-1 rounded-md border p-3", className)}>
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wide uppercase">
            {label}
            {Icon && <Icon className="size-4" />}
        </div>
        <div className="font-mono text-2xl font-semibold tabular-nums">{value}</div>
        {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
    </div>
);
