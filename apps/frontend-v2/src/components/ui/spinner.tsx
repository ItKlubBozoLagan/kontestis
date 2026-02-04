import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProperties extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
}

const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
};

export function Spinner({ size = "md", className, ...properties }: SpinnerProperties) {
    return (
        <div
            role="status"
            className={cn("flex items-center justify-center", className)}
            {...properties}
        >
            <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size])} />
            <span className="sr-only">Loading...</span>
        </div>
    );
}
