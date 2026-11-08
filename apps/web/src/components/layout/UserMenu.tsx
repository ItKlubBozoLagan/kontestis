import { KeyRound, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useCurrentUser, useLogout } from "@/api/auth";
import { LanguageMenuItems } from "@/components/layout/LanguageSwitcher";
import { type Theme, useTheme } from "@/components/theme/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/stores/session";

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

export const UserAvatar = ({
    name,
    src,
    className,
}: {
    name: string;
    src?: string;
    className?: string;
}) => (
    <Avatar className={className}>
        <AvatarImage src={src} alt={name} referrerPolicy="no-referrer" />
        <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
);

export const UserMenu = ({ temporary = false }: { temporary?: boolean }) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const logout = useLogout();
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={user.full_name}
                >
                    <UserAvatar name={user.full_name} src={user.picture_url} className="size-8" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{user.full_name}</span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                        {user.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!temporary && (
                    <DropdownMenuItem asChild>
                        <Link to="/account">
                            <User />
                            {t("nav.account")}
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Sun />
                        {t("common.theme.label")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(value) => setTheme(value as Theme)}
                        >
                            <DropdownMenuRadioItem value="light">
                                <Sun /> {t("common.theme.light")}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                                <Moon /> {t("common.theme.dark")}
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system">
                                <Monitor /> {t("common.theme.system")}
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{t("common.language")}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <LanguageMenuItems />
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                {import.meta.env.DEV && (
                    <DropdownMenuItem
                        onSelect={() =>
                            navigator.clipboard.writeText(useSessionStore.getState().token ?? "")
                        }
                    >
                        <KeyRound />
                        Copy token (dev)
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={logout}>
                    <LogOut />
                    {t("nav.logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
