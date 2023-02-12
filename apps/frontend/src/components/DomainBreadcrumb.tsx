import { darkenHex, textToColor } from "@kontestis/utils";
import React, { FC, useMemo } from "react";

import { useAuthStore } from "../state/auth";
import { Breadcrumb } from "./Breadcrumb";

type Properties = {
    email?: string;
};

export const DomainBreadcrumb: FC<Properties> = ({ email }) => {
    const { user } = useAuthStore();

    // idk, eye candy
    const emailDomain = useMemo(() => (email ?? user.email).split("@").at(-1), [user]);

    return emailDomain ? (
        <Breadcrumb
            color={textToColor(emailDomain)}
            borderColor={darkenHex(textToColor(emailDomain), 40)}
        >
            {emailDomain}
        </Breadcrumb>
    ) : (
        <></>
    );
};
