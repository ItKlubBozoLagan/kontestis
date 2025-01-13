import { AdminPermissions } from "@kontestis/models";
import { FC, useCallback, useMemo } from "react";
import {
    FiActivity,
    FiArrowLeft,
    FiClock,
    FiCpu,
    FiLayers,
    FiLogOut,
    FiSettings,
    FiUser,
} from "react-icons/all";
import tw from "twin.macro";

import { useNotifications } from "../hooks/notifications/useNotifications";
import { useOrganisation } from "../hooks/organisation/useOrganisation";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../state/auth";
import { useOrganisationStore } from "../state/organisation";
import { useProcessingLoader } from "../state/processing";
import { useTokenStore } from "../state/token";
import { Breadcrumb } from "./Breadcrumb";
import { CanAdmin } from "./CanAdmin";
import { NavElement } from "./NavElement";
import { NotificationBellDropdown } from "./NotificationBellDropdown";

export const NavBar: FC = () => {
    const { user } = useAuthStore();
    const { token, setToken } = useTokenStore();
    const { setIsSelected, organisationId } = useOrganisationStore();
    const { processingCount } = useProcessingLoader();

    const { data, isSuccess } = useOrganisation(organisationId);

    const { t } = useTranslation();

    const { data: notifications } = useNotifications({
        refetchInterval: 30 * 1000,
    });

    const navbarItems = useMemo(
        () => [
            {
                display: t("navbar.dashboard"),
                href: "",
                icon: FiCpu,
            },
            {
                display: t("navbar.contests"),
                href: "contests",
                icon: FiClock,
            },
            {
                display: t("navbar.problems"),
                href: "problems",
                icon: FiLayers,
            },
            {
                display: t("navbar.account"),
                href: "account",
                icon: FiUser,
            },
        ],
        [t]
    );

    const doAiiEduLogout = useCallback(() => {
        const tokenData = token.split(".").at(1)?.replace(/-/g, "+").replace(/_/g, "/");

        if (!tokenData) return;

        const data = JSON.parse(atob(tokenData));

        if (!("id_token" in data)) return;

        window.location.href = `${import.meta.env.VITE_AAI_EDU_LOGOUT_URL}?id_token_hint=${
            data.id_token
        }&post_logout_redirect_uri=${import.meta.env.VITE_AAI_EDU_LOGOUT_REDIRECT_URL}`;
    }, [token]);

    const logout = useCallback(() => {
        setToken("");
        doAiiEduLogout();
    }, [doAiiEduLogout, setToken]);

    return (
        <div
            css={[
                tw`w-full p-4 pl-6 flex flex-col sm:flex-row items-center justify-between items-center gap-6 flex-wrap text-base`,
                tw`bg-slate-100`,
                tw`border-solid border-l-0 border-r-0 border-t-0 border-b-2 border-neutral-300`,
            ]}
        >
            <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                <img
                    tw={"w-8 h-auto rounded-full"}
                    src={user.picture_url}
                    alt={"Profile avatar"}
                    referrerPolicy={"no-referrer"}
                />
                <div tw={"flex flex-wrap justify-center gap-6"}>
                    {navbarItems.map((item) => (
                        <NavElement item={item} key={item.href} />
                    ))}
                </div>
            </div>
            <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                <div
                    tw={"opacity-0 transition-opacity"}
                    css={processingCount > 0 ? tw`opacity-100` : ""}
                ></div>
                {notifications && <NotificationBellDropdown notifications={notifications} />}
                <NavElement
                    item={{
                        display: t("navbar.management"),
                        href: "management",
                        icon: FiSettings,
                    }}
                />
                <CanAdmin permission={AdminPermissions.ADMIN}>
                    <NavElement
                        item={{
                            display: t("navbar.admin"),
                            href: "admin/overview",
                            icon: FiActivity,
                        }}
                    />
                </CanAdmin>
                {isSuccess && (
                    <div
                        tw={"cursor-pointer"}
                        className={"group"}
                        onClick={() => setIsSelected(false)}
                    >
                        <Breadcrumb color={"#f0f0f0"}>
                            {data.name}
                            <div tw={"flex items-center group-hover:text-red-800 transition-all"}>
                                <FiArrowLeft size={"14px"} />
                            </div>
                        </Breadcrumb>
                    </div>
                )}
                <div
                    tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}
                    onClick={logout}
                >
                    <FiLogOut size={"16px"} />
                </div>
            </div>
        </div>
    );
};
