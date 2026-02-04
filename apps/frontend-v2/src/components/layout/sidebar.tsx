import { FileCode, LayoutDashboard, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Contests",
        href: "/contests",
        icon: Trophy,
    },
    {
        title: "Problems",
        href: "/problems",
        icon: FileCode,
    },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
            <nav className="flex flex-col gap-2 p-4">
                {sidebarItems.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? location.pathname === "/"
                            : location.pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
