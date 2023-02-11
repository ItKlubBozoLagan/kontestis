import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { darkenHex, textToColor } from "@kontestis/utils";
import React, { FC, useMemo } from "react";
import { FcGoogle } from "react-icons/all";
import { theme } from "twin.macro";

import { Breadcrumb } from "../../components/Breadcrumb";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

export const Account: FC = () => {
    const { user } = useAuthStore();

    // idk, eye candy
    const emailDomain = useMemo(() => user.email.split("@").at(-1), [user]);

    return (
        <div tw={"w-full md:w-5/6 flex flex-col gap-2 py-10"}>
            <TitledSection title={"Account information"}>
                <div tw={"w-full flex items-center justify-center gap-10 py-10"}>
                    <div tw={"flex flex-col justify-start gap-2 font-mono"}>
                        <img
                            tw={"w-32 w-32 rounded-full"}
                            src={user.picture_url}
                            alt={"Profile avatar"}
                            referrerPolicy={"no-referrer"}
                        />
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
                            {emailDomain && (
                                <Breadcrumb
                                    color={textToColor(emailDomain)}
                                    // color={theme`colors.neutral.200`}
                                    borderColor={darkenHex(textToColor(emailDomain), 40)}
                                >
                                    {emailDomain}
                                </Breadcrumb>
                            )}
                            {hasAdminPermission(user.permissions, AdminPermissions.ADMIN) && (
                                <Breadcrumb
                                    color={theme`colors.red.400`}
                                    borderColor={theme`colors.red.500`}
                                >
                                    Admin
                                </Breadcrumb>
                            )}
                        </div>
                        <div tw={"flex flex-col justify-between gap-2 font-mono"}>
                            <TitledInput name={"Full Name"} value={user.full_name} readOnly />
                            <TitledInput name={"E-mail"} value={user.email} readOnly />
                        </div>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
