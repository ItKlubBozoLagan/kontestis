import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", {
    variants: {
        variant: {
            info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
            success:
                "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100",
            warning:
                "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
            destructive:
                "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
        },
    },
    defaultVariants: { variant: "info" },
});

type Props = VariantProps<typeof alertVariants> & {
    icon?: ComponentType<{ className?: string }>;
    title?: ReactNode;
    children?: ReactNode;
    className?: string;
};

export const Alert = ({ variant, icon: Icon, title, children, className }: Props) => (
    <div role="alert" className={cn(alertVariants({ variant }), className)}>
        {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
        <div className="flex flex-col gap-0.5">
            {title && <span className="font-medium">{title}</span>}
            {children}
        </div>
    </div>
);
