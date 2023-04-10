import {
    AdminPermissionNames,
    AdminPermissions,
    ContestMemberPermissionNames,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { grantPermission, hasPermission, removePermission } from "permissio";
import { FC, useState } from "react";
import Modal from "react-modal";

import { ModalStyles } from "../util/ModalStyles";
import { SimpleButton } from "./SimpleButton";

type Properties = {
    permissions: bigint;
    type: PermissionType;
    editor_permission: bigint;
    onSave: (newPermissions: bigint) => void;
};

type PermissionType = "admin" | "contest_member";

type PermissionData = {
    permission: Record<string, unknown>;
    keys: string[];
    function: (p: bigint, id: number) => boolean;
};

const permissionByType = {
    admin: {
        permission: AdminPermissions,
        keys: AdminPermissionNames,
        function: hasAdminPermission,
    },
    contest_member: {
        permission: ContestMemberPermissions,
        keys: ContestMemberPermissionNames,
        function: hasContestPermission,
    },
} satisfies Record<PermissionType, PermissionData>;

export const PermissionsModal: FC<Modal.Props & Properties> = ({
    permissions,
    type,
    editor_permission,
    onSave,
    ...properties
}) => {
    const [newPermissions, setNewPermissions] = useState(permissions);

    const permissionData = permissionByType[type];

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Permissions"}
            style={ModalStyles}
        >
            <div tw={"flex flex-col gap-5 justify-end"}>
                <span tw={"text-2xl"}>Permissions</span>
                <div tw={"grid grid-cols-2"}>
                    {permissionData.keys.map((name) => (
                        <div key={name} tw={"flex"}>
                            <input
                                type={"checkbox"}
                                checked={hasPermission(
                                    newPermissions,
                                    permissionData.permission[
                                        name as keyof typeof permissionData.permission
                                    ]
                                )}
                                onChange={(event) => {
                                    if (event.target.checked) {
                                        setNewPermissions(
                                            grantPermission(
                                                newPermissions,
                                                permissionData.permission[
                                                    name as keyof typeof permissionData.permission
                                                ]
                                            )
                                        );

                                        return;
                                    }

                                    setNewPermissions(
                                        removePermission(
                                            newPermissions,
                                            permissionData.permission[
                                                name as keyof typeof permissionData.permission
                                            ]
                                        )
                                    );
                                }}
                                disabled={
                                    !(
                                        permissionData.function as (
                                            p: bigint,
                                            id: number
                                        ) => boolean
                                    )(
                                        editor_permission,
                                        permissionData.permission[
                                            name as keyof typeof permissionData.permission
                                        ]
                                    )
                                }
                            />
                            <span>{name}</span>
                        </div>
                    ))}
                </div>
                <SimpleButton
                    tw={"w-1/3 self-end"}
                    onClick={() => {
                        properties.onAfterClose?.();
                        onSave(newPermissions);
                    }}
                >
                    Save
                </SimpleButton>
            </div>
        </Modal>
    );
};
