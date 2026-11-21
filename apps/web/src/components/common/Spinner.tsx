import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export const Spinner = ({ className }: { className?: string }) => (
    <Loader2 className={cn("text-muted-foreground size-5 animate-spin", className)} />
);

export const FullPageSpinner = () => (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
        <Spinner className="size-8" />
    </div>
);
