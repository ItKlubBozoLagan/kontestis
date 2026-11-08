import { zodResolver } from "@hookform/resolvers/zod";
import {
    ContestMemberPermissionNames,
    ContestMemberPermissions,
    type ContestMemberWithInfo,
} from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { hasPermission } from "permissio";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrentUser } from "@/api/auth";
import { contestQueries, useRemoveContestMember, useUpdateContestMember } from "@/api/contests";
import { useAddContestParticipant } from "@/api/extra-management";
import { RankBadge } from "@/components/badges/RankBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { PermissionsDialog } from "@/components/common/PermissionsDialog";
import { Section } from "@/components/common/Section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BulkTemporaryUsers } from "@/features/management/participants/BulkTemporaryUsers";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";
import { isAdmin } from "@/lib/permissions";

const isStaff = (member: ContestMemberWithInfo) =>
    hasPermission(member.contest_permissions, ContestMemberPermissions.ADMIN) ||
    hasPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE);

const AddParticipantForm = ({ contestId }: { contestId: bigint }) => {
    const { t } = useTranslation();
    const add = useAddContestParticipant(contestId);
    const form = useForm({
        resolver: zodResolver(z.object({ email: z.email() })),
        defaultValues: { email: "" },
    });

    return (
        <Section title={t("management.participants.add.title")} icon={UserPlus}>
            <Form {...form}>
                <form
                    className="flex flex-wrap items-start gap-2"
                    onSubmit={form.handleSubmit(({ email }) =>
                        add.mutate(email.trim().toLowerCase(), {
                            onSuccess: () => {
                                form.reset();
                                toast.success(t("management.participants.add.added"));
                            },
                            onError: () =>
                                form.setError("email", {
                                    message: t("management.participants.add.failed"),
                                }),
                        })
                    )}
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="min-w-64 flex-1">
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder={t("management.participants.add.placeholder")}
                                        aria-label={t("management.participants.add.email")}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={add.isPending}>
                        {t("management.participants.add.submit")}
                    </Button>
                </form>
            </Form>
        </Section>
    );
};

export const ParticipantsPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const contest = useManagedContest();
    const { can } = useContestAccess(contest);
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id, true));
    const updateMember = useUpdateContestMember(contest.id);
    const removeMember = useRemoveContestMember(contest.id);

    const canEditPermissions = can(ContestMemberPermissions.EDIT_USER_PERMISSIONS);
    const canRemove = can(ContestMemberPermissions.REMOVE_USER);

    const sorted = useMemo(
        () =>
            [...members].sort(
                (a, b) =>
                    Number(isStaff(b)) - Number(isStaff(a)) ||
                    a.full_name.localeCompare(b.full_name)
            ),
        [members]
    );

    const columns = useMemo<ColumnDef<ContestMemberWithInfo>[]>(
        () => [
            {
                accessorKey: "full_name",
                header: t("management.participants.table.name"),
                cell: ({ row }) => (
                    <span className="font-sans font-medium">{row.original.full_name}</span>
                ),
            },
            {
                id: "domain",
                accessorFn: (member) => `${member.email_domain} ${member.edu_mail_domain ?? ""}`,
                header: t("management.participants.table.domain"),
                cell: ({ row }) => {
                    const { email_domain: domain, edu_mail_domain: eduDomain } = row.original;

                    return (
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{domain}</Badge>
                            {eduDomain && eduDomain.toLowerCase() !== domain.toLowerCase() && (
                                <Badge
                                    variant="outline"
                                    className="border-sky-300 text-sky-800 dark:text-sky-300"
                                >
                                    {eduDomain}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "elo",
                header: t("management.participants.table.rating"),
                cell: ({ row }) => <RankBadge elo={row.original.elo} showElo />,
            },
            {
                id: "role",
                accessorFn: (member) => (isStaff(member) ? 0 : 1),
                header: t("management.participants.table.role"),
                cell: ({ row }) =>
                    isStaff(row.original) ? (
                        <Badge variant="destructive">{t("management.participants.staff")}</Badge>
                    ) : (
                        <Badge variant="secondary">
                            {t("management.participants.participant")}
                        </Badge>
                    ),
            },
            {
                id: "actions",
                header: "",
                enableSorting: false,
                meta: { className: "w-0" },
                cell: ({ row }) => {
                    const member = row.original;
                    const self = member.user_id === user.id;

                    return (
                        <div className="flex justify-end gap-1 font-sans">
                            <PermissionsDialog
                                name={member.full_name}
                                names={ContestMemberPermissionNames}
                                bits={ContestMemberPermissions}
                                value={member.contest_permissions}
                                disabled={!canEditPermissions}
                                canGrant={(bit) => can(bit)}
                                onSave={(permissions) =>
                                    updateMember.mutateAsync(
                                        { userId: member.user_id, permissions },
                                        {
                                            onSuccess: () =>
                                                toast.success(
                                                    t("management.participants.permissionsSaved")
                                                ),
                                        }
                                    )
                                }
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={!canEditPermissions}
                                    >
                                        <KeyRound />
                                        {t("management.participants.permissions")}
                                    </Button>
                                }
                            />
                            {canRemove &&
                                !self &&
                                !hasPermission(
                                    member.contest_permissions,
                                    ContestMemberPermissions.ADMIN
                                ) && (
                                    <ConfirmDialog
                                        title={t("management.participants.removeTitle", {
                                            name: member.full_name,
                                        })}
                                        description={t("management.participants.removeDescription")}
                                        confirmLabel={t("management.participants.remove")}
                                        onConfirm={() =>
                                            removeMember.mutateAsync(member.user_id, {
                                                onSuccess: () =>
                                                    toast.success(
                                                        t("management.participants.removed")
                                                    ),
                                            })
                                        }
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive size-8"
                                                aria-label={t("management.participants.remove")}
                                            >
                                                <Trash2 />
                                            </Button>
                                        }
                                    />
                                )}
                        </div>
                    );
                },
            },
        ],
        [t, user.id, can, canEditPermissions, canRemove, updateMember, removeMember]
    );

    return (
        <div className="flex flex-col gap-6">
            {can(ContestMemberPermissions.ADD_USER) && (
                <AddParticipantForm contestId={contest.id} />
            )}
            <DataTable
                columns={columns}
                data={sorted}
                searchable
                pageSize={50}
                getRowId={(member) => member.id.toString()}
                toolbar={
                    <span className="text-muted-foreground text-sm">
                        {t("management.participants.count", { count: members.length })}
                    </span>
                }
            />
            {isAdmin(user) && <BulkTemporaryUsers contest={contest} />}
        </div>
    );
};
