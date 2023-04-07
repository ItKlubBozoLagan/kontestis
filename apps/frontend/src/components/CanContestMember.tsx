import {
    AdminPermissions,
    ContestMember,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { FC, ReactNode } from "react";

import { useAuthStore } from "../state/auth";

type Properties = {
    member: ContestMember | undefined;
    permission: ContestMemberPermissions;
    adminPermission: AdminPermissions;
    children: ReactNode | ReactNode[];
};

export const CanContestMember: FC<Properties> = ({
    member,
    permission,
    adminPermission,
    children,
}) => {
    const { user } = useAuthStore();

    if (
        (!member || !hasContestPermission(member.contest_permissions, permission)) &&
        !hasAdminPermission(user.permissions, adminPermission)
    )
        return <></>;

    return <>{children}</>;
};
