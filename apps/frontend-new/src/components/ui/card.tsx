import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div
            ref={reference}
            className={cn(
                "rounded-lg border border-slate-200 bg-neutral-100 text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50",
                className
            )}
            {...properties}
        />
    )
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div
            ref={reference}
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...properties}
        />
    )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div
            ref={reference}
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...properties}
        />
    )
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div
            ref={reference}
            className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
            {...properties}
        />
    )
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div ref={reference} className={cn("p-6 pt-0", className)} {...properties} />
    )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...properties }, reference) => (
        <div
            ref={reference}
            className={cn("flex items-center p-6 pt-0", className)}
            {...properties}
        />
    )
);

CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
