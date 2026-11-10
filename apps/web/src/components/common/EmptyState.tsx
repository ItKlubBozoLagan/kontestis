import { Inbox } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
    title?: ReactNode;
    description?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    action?: ReactNode;
    className?: string;
};

export const EmptyState = ({
    title,
    description,
    icon: Icon = Inbox,
    action,
    className,
}: Props) => (
    <div
        className={cn(
            "text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-center",
            className
        )}
    >
        <Icon className="size-8 opacity-60" />
        {title && <p className="text-foreground font-medium">{title}</p>}
        {description && <p className="max-w-sm text-sm">{description}</p>}
        {action}
    </div>
);
