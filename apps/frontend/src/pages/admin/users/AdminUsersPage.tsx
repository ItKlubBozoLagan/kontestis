import { AdminPermissions, hasAdminPermission, User } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { theme } from "twin.macro";

import { Breadcrumb } from "../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../components/DomainBreadcrumb";
import { PermissionsModal } from "../../../components/PermissionsModal";
import { useAllUsers } from "../../../hooks/user/useAllUsers";
import { useModifyUser } from "../../../hooks/user/useModifyUser";
import { useTranslation } from "../../../hooks/useTranslation";
import { useAuthStore } from "../../../state/auth";
import { R } from "../../../util/remeda";

type Properties = {
    user: User;
};

const MemberBox: FC<Properties> = ({ user }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const { user: editor } = useAuthStore();

    const modifyMutation = useModifyUser(user.id);

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    }, [modifyMutation]);

    const { t } = useTranslation();

    return (
        <div tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-neutral-400"}>
            <PermissionsModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
                permissions={user.permissions}
                type={"admin"}
                editor_permission={editor.permissions}
                onSave={(permissions) => {
                    modifyMutation.mutate({
                        permissions: permissions,
                    });
                }}
            />
            <div tw={"flex gap-2"}>
                {hasAdminPermission(user.permissions, AdminPermissions.ADMIN) && (
                    <Breadcrumb color={theme`colors.red.400`}>
                        {t("account.breadcrumbs.admin")}
                    </Breadcrumb>
                )}
                <DomainBreadcrumb email={user.email} />
                {user.full_name} ({user.email})
            </div>
            {user.id !== editor.id && (
                <div tw={"flex items-center gap-4"}>
                    <div
                        tw={"text-red-600 cursor-pointer select-none"}
                        onClick={() => setModalOpen(true)}
                    >
                        {t("admin.users.editPermission")}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminUsersPage: FC = () => {
    const { data: users } = useAllUsers();

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-5"}>
            <span tw={"text-3xl"}>{t("admin.users.title")}</span>
            <div tw={"w-full flex flex-col gap-5"}>
                {R.sortBy(
                    users ?? [],
                    (u) => !hasAdminPermission(u.permissions, AdminPermissions.ADMIN),
                    (u) => u.full_name
                ).map((user) => (
                    <MemberBox user={user} key={user.id.toString()} />
                ))}
            </div>
        </div>
    );
};
