import { Contest, ContestMember, ContestMemberPermissions } from "@kontestis/models";
import { FC, ReactNode } from "react";

import { useContestPermission } from "../hooks/contest/useContestPermission";

type Properties = {
    contest: Pick<Contest, "id" | "organisation_id">;
    member?: ContestMember;
    permission: ContestMemberPermissions;
    children: ReactNode | ReactNode[];
};

export const CanContestMember: FC<Properties> = ({ contest, member, permission, children }) => {
    const allowed = useContestPermission(permission, contest, member);

    if (!allowed) return <></>;

    return <>{children}</>;
};
