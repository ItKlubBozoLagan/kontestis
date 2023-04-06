import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { capitalize } from "@kontestis/utils";
import React, { FC } from "react";
import { FcGoogle, RxTriangleDown } from "react-icons/all";
import { theme } from "twin.macro";

import { Breadcrumb } from "../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../components/DomainBreadcrumb";
import { RankBreadcrumb } from "../../components/RankBreadcrumb";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useElo } from "../../hooks/organisation/useElo";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import {
    AllRanks,
    colorFromRank,
    GlobalRank,
    minScoreForRank,
    nextRankFromRank,
} from "../../util/rank";

type RankComponentProperties = {
    rankName: GlobalRank;
};

const RankPoint: FC<RankComponentProperties> = ({ rankName }) => {
    return (
        <div
            tw={"relative w-3 h-3 rounded-full"}
            style={{ backgroundColor: colorFromRank(rankName) }}
        >
            <span tw={"absolute top-4 left-0 text-sm"} style={{ transform: "translateX(-40%)" }}>
                {capitalize(rankName)}
            </span>
            <span
                tw={"absolute -top-5 left-0 text-sm w-12 text-center"}
                style={{ transform: "translate(-40%)" }}
            >
                {minScoreForRank(rankName)}
            </span>
        </div>
    );
};

const RankConnection: FC<RankComponentProperties & { basis: number }> = ({ rankName, basis }) => {
    return (
        <div
            tw={"flex-grow h-1"}
            css={basis ? { flexBasis: `calc(${basis * 100}% - 7 * 0.75rem)` } : ""}
            style={{ backgroundColor: colorFromRank(rankName) }}
        ></div>
    );
};

export const AccountPage: FC = () => {
    const { user } = useAuthStore();
    const elo = useElo();

    const { t } = useTranslation();

    return (
        <div tw={"w-full md:w-5/6 flex flex-col gap-2 py-10"}>
            <TitledSection title={t("account.label")}>
                <div tw={"w-full flex items-center justify-center gap-10 py-10"}>
                    <div tw={"flex flex-col items-center justify-start gap-4 font-mono"}>
                        <img
                            tw={"w-32 w-32 rounded-full"}
                            src={user.picture_url}
                            alt={"Profile avatar"}
                            referrerPolicy={"no-referrer"}
                        />
                        <RankBreadcrumb showExact />
                    </div>
                    <div tw={"flex flex-col gap-2"}>
                        <div tw={"flex gap-2"}>
                            <Breadcrumb
                                prependIcon={FcGoogle}
                                color={theme`colors.white`}
                                borderColor={theme("colors.neutral.200")}
                            >
                                Google
                            </Breadcrumb>
                            <DomainBreadcrumb />
                            {hasAdminPermission(user.permissions, AdminPermissions.ADMIN) && (
                                <Breadcrumb
                                    color={theme`colors.red.400`}
                                    borderColor={theme`colors.red.500`}
                                >
                                    {t("account.breadcrumbs.admin")}
                                </Breadcrumb>
                            )}
                        </div>
                        <div tw={"flex flex-col justify-between gap-2 font-mono"}>
                            <TitledInput
                                label={t("account.fullName")}
                                value={user.full_name}
                                readOnly
                            />
                            <TitledInput label={t("account.email")} value={user.email} readOnly />
                        </div>
                    </div>
                </div>
                <div tw={"w-10/12 flex items-center pb-12 pt-4 relative"}>
                    <RxTriangleDown
                        size={"32px"}
                        tw={"text-yellow-500 absolute -top-3"}
                        style={{
                            left: `min(96%, calc(-12px + ((${elo}/3200) * 98%))`,
                        }}
                    />
                    {AllRanks.map((rank, index) => (
                        <React.Fragment key={rank}>
                            <RankPoint rankName={rank} />
                            {index + 1 !== AllRanks.length && (
                                <RankConnection
                                    rankName={rank}
                                    basis={
                                        (minScoreForRank(
                                            nextRankFromRank(rank as Exclude<GlobalRank, "prodigy">)
                                        ) -
                                            minScoreForRank(rank)) /
                                        3200
                                    }
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </TitledSection>
        </div>
    );
};
