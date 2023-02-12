import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { FC, ReactNode } from "react";

import { useAuthStore } from "../state/auth";

type Properties = {
    permission: AdminPermissions;
    children: ReactNode | ReactNode[];
};

export const CanAdmin: FC<Properties> = ({ permission, children }) => {
    const { user } = useAuthStore();

    if (!hasAdminPermission(user.permissions, permission)) return <></>;

    return <>{children}</>;
};
