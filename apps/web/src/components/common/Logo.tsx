import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
    <img
        src="/favicon_light.png"
        alt="Kontestis"
        className={cn("size-8 rounded-full", className)}
    />
);
