import { LogOut, Shield, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth";
import { useOrganisationStore } from "@/store/organisation";
import { useTokenStore } from "@/store/token";

// Rank utilities (simplified from original)
const AllRanks = [
    "newbie",
    "pupil",
    "specialist",
    "expert",
    "candidate",
    "master",
    "grandmaster",
    "prodigy",
] as const;

type GlobalRank = (typeof AllRanks)[number];

const rankColors: Record<GlobalRank, string> = {
    newbie: "#808080",
    pupil: "#008000",
    specialist: "#03A89E",
    expert: "#0000FF",
    candidate: "#AA00AA",
    master: "#FF8C00",
    grandmaster: "#FF0000",
    prodigy: "#FFD700",
};

const rankMinScores: Record<GlobalRank, number> = {
    newbie: 0,
    pupil: 400,
    specialist: 800,
    expert: 1200,
    candidate: 1600,
    master: 2000,
    grandmaster: 2400,
    prodigy: 2800,
};

function getRankFromElo(elo: number): GlobalRank {
    for (let index = AllRanks.length - 1; index >= 0; index--) {
        if (elo >= rankMinScores[AllRanks[index]]) {
            return AllRanks[index];
        }
    }

    return "newbie";
}

export function AccountPage() {
    const { user, setIsLoggedIn, setUser } = useAuthStore();
    const { setToken } = useTokenStore();
    const { reset: resetOrganisation } = useOrganisationStore();
    const { t } = useTranslation();

    // Mock ELO for now - would come from API
    const elo = 1250;

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        setToken(null);
        resetOrganisation();
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Please log in to view your account</p>
            </div>
        );
    }

    const initials =
        user.full_name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";

    const currentRank = getRankFromElo(elo);
    const eloProgress = Math.min(100, (elo / 3200) * 100);

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <User className="h-8 w-8" />
                    {t("navbar.account")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("account.label")}</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("account.profile")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Avatar and Rank */}
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src={user.picture_url ?? undefined} />
                                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                            </Avatar>
                            <Badge
                                className="capitalize text-white px-4 py-1"
                                style={{ backgroundColor: rankColors[currentRank] }}
                            >
                                {currentRank}
                            </Badge>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {user.is_edu && (
                                    <Badge variant="secondary" className="gap-1">
                                        AAI@EduHr - {user.edu_data?.associated_org}
                                    </Badge>
                                )}
                                {user.auth_source === "google" && (
                                    <Badge variant="outline" className="gap-1">
                                        <FcGoogle className="h-4 w-4" />
                                        Google
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        {t("account.fullName")}
                                    </label>
                                    <p className="font-mono text-lg">{user.full_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        {t("account.email")}
                                    </label>
                                    <p className="font-mono text-lg">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ELO/Rank Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("account.elo")}</CardTitle>
                    <CardDescription>Your competitive rating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <span className="text-4xl font-bold">{elo}</span>
                        <span className="text-muted-foreground ml-2">ELO</span>
                    </div>

                    {/* Rank Progress Bar */}
                    <div className="relative pt-8 pb-8">
                        {/* Arrow indicator */}
                        <div
                            className="absolute -top-2 transform -translate-x-1/2"
                            style={{ left: `${eloProgress}%` }}
                        >
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-yellow-500" />
                            <div className="text-center text-sm font-medium mt-1 -ml-4 w-8">
                                {elo}
                            </div>
                        </div>

                        {/* Progress bar background */}
                        <div className="h-2 rounded-full bg-muted flex">
                            {AllRanks.map((rank, index) => {
                                const start = rankMinScores[rank] / 3200;
                                const end =
                                    index < AllRanks.length - 1
                                        ? rankMinScores[AllRanks[index + 1]] / 3200
                                        : 1;
                                const width = (end - start) * 100;

                                return (
                                    <div
                                        key={rank}
                                        className="h-full first:rounded-l-full last:rounded-r-full"
                                        style={{
                                            width: `${width}%`,
                                            backgroundColor: rankColors[rank],
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Rank labels */}
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            {AllRanks.filter((_, index) => index % 2 === 0).map((rank) => (
                                <span key={rank} className="capitalize">
                                    {rank}
                                </span>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("account.statistics")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatItem label={t("navbar.contests")} value="12" />
                        <StatItem label={t("navbar.problems")} value="47" />
                        <StatItem label={t("navbar.submissions")} value="156" />
                        <StatItem label="Acceptance Rate" value="68%" />
                    </div>
                </CardContent>
            </Card>

            {/* Session / Logout */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Session
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">Current Session</p>
                                <p className="text-sm text-muted-foreground">Active now</p>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Active
                        </Badge>
                    </div>

                    <Separator />

                    <div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Logging out will end your current session
                        </p>
                        <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            {t("account.logout")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}
