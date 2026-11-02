import { DEFAULT_ELO } from "@kontestis/models";
import { textToHexColor } from "@kontestis/utils";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/api/auth";
import { useCurrentOrganisationMembership } from "@/api/organisations";
import { RankBadge } from "@/components/badges/RankBadge";
import { SubmissionActivity } from "@/components/charts/SubmissionActivity";
import { PageHeader } from "@/components/common/PageHeader";
import { Section } from "@/components/common/Section";
import { UserAvatar } from "@/components/layout/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EduDetails } from "@/features/account/EduDetails";
import { EloChart } from "@/features/account/EloChart";
import { RankProgress } from "@/features/account/RankProgress";
import { isAdmin } from "@/lib/permissions";
import { nextRank } from "@/lib/rank";

export const AccountPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const { data: membership } = useCurrentOrganisationMembership();

    const elo = membership?.elo ?? DEFAULT_ELO;
    const domain = user.email.split("@").at(-1);
    const upcoming = nextRank(elo);

    return (
        <>
            <PageHeader title={t("account.title")} />
            <Section title={t("account.label")} contentClassName="p-6">
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                    <div className="flex flex-col items-center gap-3">
                        <UserAvatar
                            name={user.full_name}
                            src={user.picture_url}
                            className="size-28 text-2xl"
                        />
                        <RankBadge elo={elo} showElo />
                    </div>
                    <div className="flex w-full max-w-md flex-col gap-4">
                        <div className="flex flex-wrap gap-1.5">
                            {domain && (
                                <Badge
                                    variant="outline"
                                    className="text-neutral-900"
                                    style={{
                                        backgroundColor: textToHexColor(domain),
                                        borderColor: textToHexColor(domain),
                                    }}
                                >
                                    {domain}
                                </Badge>
                            )}
                            {user.is_edu && (
                                <Badge variant="secondary">
                                    AAI@EduHr – {user.edu_data.associated_org}
                                </Badge>
                            )}
                            {user.auth_source === "google" && (
                                <Badge variant="outline">{t("account.badges.google")}</Badge>
                            )}
                            {user.auth_source === "managed" && (
                                <Badge variant="outline">{t("account.badges.managed")}</Badge>
                            )}
                            {isAdmin(user) && (
                                <Badge variant="destructive">{t("account.badges.admin")}</Badge>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="account-name">{t("account.fullName")}</Label>
                            <Input
                                id="account-name"
                                value={user.full_name}
                                readOnly
                                className="font-mono"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="account-email">{t("account.email")}</Label>
                            <Input
                                id="account-email"
                                value={user.email}
                                readOnly
                                className="font-mono"
                            />
                        </div>
                    </div>
                </div>
            </Section>
            <Section
                title={t("account.rank.title")}
                actions={
                    <span className="text-muted-foreground text-sm">
                        {upcoming
                            ? t("account.rank.next", {
                                  points: upcoming.min - elo,
                                  rank: t(`ranks.${upcoming.name}`),
                              })
                            : t("account.rank.max")}
                    </span>
                }
            >
                <RankProgress elo={elo} />
                <p className="text-muted-foreground text-xs">{t("account.rank.hint")}</p>
            </Section>
            <EduDetails user={user} />
            <SubmissionActivity />
            <EloChart />
        </>
    );
};
