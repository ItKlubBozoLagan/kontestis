import { Building2, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import favicon from "/favicon_light.png";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";
import { useAuthStore, useOrganisationStore, useTokenStore } from "@/store";

export function Navbar() {
    const { user } = useAuthStore();
    const { setToken } = useTokenStore();
    const { reset: resetOrganisation } = useOrganisationStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = () => {
        setToken("");
        resetOrganisation();
        navigate("/");
    };

    const handleSwitchOrg = () => {
        resetOrganisation();
    };

    const initials =
        user?.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "U";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                    <img src={favicon} alt="Kontestis" className="h-7 w-7" />
                    <span>Kontestis</span>
                </Link>

                <nav className="flex items-center gap-6 ml-8">
                    <Link
                        to="/"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("navbar.dashboard")}
                    </Link>
                    <Link
                        to="/contests"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("navbar.contests")}
                    </Link>
                    <Link
                        to="/problems"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("navbar.problems")}
                    </Link>
                </nav>

                <div className="flex items-center gap-2 ml-auto">
                    <NotificationsDropdown />
                    <LanguageToggle />
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={user?.picture_url}
                                        alt={user?.full_name ?? "User"}
                                    />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.full_name}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/account" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{t("navbar.account")}</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSwitchOrg} className="cursor-pointer">
                                <Building2 className="mr-2 h-4 w-4" />
                                <span>{t("organisations.page.title")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{t("login.logout")}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
