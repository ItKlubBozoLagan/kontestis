import { useIsMutating } from "@tanstack/react-query";
import { Activity, Clock, Cpu, Layers, Loader2, Menu, Settings, User } from "lucide-react";
import { type ComponentType, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { Logo } from "@/components/common/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { OrganisationSwitcher } from "@/components/layout/OrganisationSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    end?: boolean;
};

const NavItemLink = ({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) => (
    <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 font-semibold transition-colors",
                "text-neutral-500 hover:text-sky-800 dark:text-neutral-400 dark:hover:text-sky-300",
                isActive && "text-primary hover:text-primary dark:text-primary"
            )
        }
    >
        <item.icon className="size-4" />
        {item.label}
    </NavLink>
);

const MutationIndicator = () => {
    const mutating = useIsMutating();

    return (
        <Loader2
            aria-hidden
            className={cn(
                "text-muted-foreground size-4 animate-spin transition-opacity",
                mutating > 0 ? "opacity-100" : "opacity-0"
            )}
        />
    );
};

export const Navbar = ({ temporary = false }: { temporary?: boolean }) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const [mobileOpen, setMobileOpen] = useState(false);

    const primary: NavItem[] = temporary
        ? [{ to: "/", label: t("nav.contests"), icon: Clock, end: true }]
        : [
              { to: "/", label: t("nav.dashboard"), icon: Cpu, end: true },
              { to: "/contests", label: t("nav.contests"), icon: Clock },
              { to: "/problems", label: t("nav.problems"), icon: Layers },
              { to: "/account", label: t("nav.account"), icon: User },
          ];

    const secondary: NavItem[] = temporary
        ? []
        : [
              { to: "/management", label: t("nav.management"), icon: Settings },
              ...(isAdmin(user) ? [{ to: "/admin", label: t("nav.admin"), icon: Activity }] : []),
          ];

    return (
        <header className="bg-nav sticky top-0 z-40 w-full border-b-2 border-neutral-300 dark:border-neutral-800">
            <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            aria-label={t("nav.menu")}
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                <Logo /> {t("common.appName")}
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-1 px-4">
                            {[...primary, ...secondary].map((item) => (
                                <NavItemLink
                                    key={item.to}
                                    item={item}
                                    onNavigate={() => setMobileOpen(false)}
                                />
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                <Link to="/" className="flex shrink-0 items-center gap-2">
                    <Logo />
                    <span className="hidden font-semibold tracking-tight sm:inline lg:hidden xl:inline">
                        {t("common.appName")}
                    </span>
                </Link>
                <nav className="hidden items-center gap-1 lg:flex">
                    {primary.map((item) => (
                        <NavItemLink key={item.to} item={item} />
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    <MutationIndicator />
                    {!temporary && <NotificationBell />}
                    <nav className="hidden items-center gap-1 lg:flex">
                        {secondary.map((item) => (
                            <NavItemLink key={item.to} item={item} />
                        ))}
                    </nav>
                    {!temporary && <OrganisationSwitcher />}
                    <UserMenu temporary={temporary} />
                </div>
            </div>
        </header>
    );
};
