import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = () => (
    <div className="flex w-full flex-col gap-6" aria-busy>
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
    </div>
);
