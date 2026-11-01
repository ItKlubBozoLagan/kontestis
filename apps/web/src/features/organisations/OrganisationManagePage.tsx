import { zodResolver } from "@hookform/resolvers/zod";
import {
    type Organisation,
    type OrganisationMemberWithInfo,
    OrganisationPermissionNames,
    OrganisationPermissions,
} from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Building2, Gauge, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { hasPermission } from "permissio";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrentUser } from "@/api/auth";
import { HttpError } from "@/api/http";
import {
    organisationQueries,
    useAddOrganisationMember,
    useRemoveOrganisationMember,
    useRenameOrganisation,
    useUpdateOrganisationMember,
} from "@/api/organisations";
import { RankBadge } from "@/components/badges/RankBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CopyButton } from "@/components/common/CopyButton";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionsDialog } from "@/components/common/PermissionsDialog";
import { Section } from "@/components/common/Section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canInOrganisation } from "@/lib/permissions";

const InfoSection = ({
    organisation,
    memberCount,
}: {
    organisation: Organisation;
    memberCount: number;
}) => {
    const { t } = useTranslation();
    const rename = useRenameOrganisation(organisation.id);
    const schema = z.object({ name: z.string().trim().min(1).max(128) });
    const form = useForm({ resolver: zodResolver(schema), values: { name: organisation.name } });

    const onSubmit = form.handleSubmit((values) =>
        rename.mutate(values, {
            onSuccess: () => toast.success(t("organisations.manage.info.renamed")),
            onError: (error: HttpError) => {
                if (error.status === 409)
                    form.setError("name", { message: t("organisations.manage.info.conflict") });
            },
        })
    );

    return (
        <Section title={t("organisations.manage.info.title")} icon={Building2}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <Form {...form}>
                    <form onSubmit={onSubmit} className="flex items-start gap-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>{t("organisations.manage.info.name")}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <Button
                                            type="submit"
                                            disabled={rename.isPending || !form.formState.isDirty}
                                        >
                                            {t("organisations.manage.info.rename")}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <dl className="grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-1 text-sm md:border-l md:pl-4">
                    <dt className="text-muted-foreground">{t("organisations.manage.info.id")}</dt>
                    <dd className="flex items-center gap-1 font-mono">
                        {organisation.id.toString()}
                        <CopyButton value={organisation.id.toString()} />
                    </dd>
                    <dt className="text-muted-foreground">
                        {t("organisations.manage.info.members")}
                    </dt>
                    <dd className="font-mono">{memberCount}</dd>
                </dl>
            </div>
        </Section>
    );
};

const AddMemberForm = ({ organisationId }: { organisationId: bigint }) => {
    const { t } = useTranslation();
    const add = useAddOrganisationMember(organisationId);
    const schema = z.object({ email: z.email() });
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

    const onSubmit = form.handleSubmit(({ email }) =>
        add.mutate(
            { email: email.trim() },
            {
                onSuccess: () => {
                    toast.success(t("organisations.manage.members.added"));
                    form.reset();
                },
                onError: () =>
                    form.setError("email", {
                        message: t("organisations.manage.members.addFailed"),
                    }),
            }
        )
    );

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="flex w-full max-w-md items-start gap-2">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder={t("organisations.manage.members.addPlaceholder")}
                                    aria-label={t("organisations.manage.members.add")}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={add.isPending}>
                    <UserPlus />
                    {t("organisations.manage.members.add")}
                </Button>
            </form>
        </Form>
    );
};

const EloDialog = ({
    member,
    onSave,
}: {
    member: OrganisationMemberWithInfo;
    onSave: (elo: number) => Promise<unknown>;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [elo, setElo] = useState(String(member.elo));
    const [saving, setSaving] = useState(false);
    const valid = /^\d{1,5}$/.test(elo);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) setElo(String(member.elo));
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="font-sans">
                    <Gauge />
                    {t("organisations.manage.members.editElo")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("organisations.manage.members.eloTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("organisations.manage.members.eloDescription", {
                            name: member.full_name,
                        })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="member-elo">{t("organisations.manage.members.elo")}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="member-elo"
                            inputMode="numeric"
                            value={elo}
                            onChange={(event) => setElo(event.target.value)}
                            className="font-mono"
                        />
                        {valid && <RankBadge elo={Number(elo)} />}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        disabled={!valid || saving}
                        onClick={async () => {
                            setSaving(true);

                            try {
                                await onSave(Number(elo));
                                setOpen(false);
                            } finally {
                                setSaving(false);
                            }
                        }}
                    >
                        {t("common.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const MembersSection = ({
    organisation,
    members,
}: {
    organisation: Organisation;
    members: OrganisationMemberWithInfo[];
}) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const update = useUpdateOrganisationMember(organisation.id);
    const remove = useRemoveOrganisationMember(organisation.id);

    const editor = members.find((member) => member.user_id === user.id);
    const canEditUsers = canInOrganisation(
        user,
        editor?.permissions,
        OrganisationPermissions.EDIT_USER
    );
    const canRemove = canInOrganisation(user, editor?.permissions, OrganisationPermissions.ADMIN);

    // owner first, then alphabetical
    const sorted = useMemo(
        () =>
            [...members].sort((a, b) =>
                a.user_id === organisation.owner
                    ? -1
                    : b.user_id === organisation.owner
                    ? 1
                    : a.full_name.localeCompare(b.full_name)
            ),
        [members, organisation.owner]
    );

    const columns = useMemo<ColumnDef<OrganisationMemberWithInfo>[]>(
        () => [
            {
                accessorKey: "full_name",
                header: t("organisations.manage.members.columns.name"),
                cell: ({ row: { original: member } }) => (
                    <div className="flex flex-wrap items-center gap-1.5 font-sans">
                        <span className="font-medium">{member.full_name}</span>
                        {member.user_id === organisation.owner && (
                            <Badge variant="destructive">
                                {t("organisations.manage.members.owner")}
                            </Badge>
                        )}
                        {hasPermission(member.permissions, OrganisationPermissions.ADMIN) && (
                            <Badge className="bg-purple-600 text-white">
                                <ShieldCheck />
                                {t("organisations.manage.members.orgAdmin")}
                            </Badge>
                        )}
                        {member.user_id === user.id && (
                            <Badge variant="outline">{t("organisations.manage.members.you")}</Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "email_domain",
                header: t("organisations.manage.members.columns.domain"),
                cell: ({ getValue }) => (
                    <span className="text-muted-foreground">@{getValue<string>()}</span>
                ),
            },
            {
                accessorKey: "elo",
                header: t("organisations.manage.members.columns.elo"),
                cell: ({ row }) => <RankBadge elo={row.original.elo} showElo />,
            },
            {
                id: "actions",
                header: "",
                enableSorting: false,
                meta: { className: "text-right" },
                cell: ({ row: { original: member } }) => {
                    const isOwner = member.user_id === organisation.owner;
                    const isSelf = member.user_id === user.id;

                    if (isOwner || !canEditUsers) return null;

                    return (
                        <div className="flex justify-end gap-1">
                            {!isSelf && (
                                <PermissionsDialog
                                    trigger={
                                        <Button variant="ghost" size="sm" className="font-sans">
                                            <ShieldCheck />
                                            {t("organisations.manage.members.editPermissions")}
                                        </Button>
                                    }
                                    name={member.full_name}
                                    names={OrganisationPermissionNames}
                                    bits={OrganisationPermissions}
                                    value={member.permissions}
                                    canGrant={(bit) =>
                                        canInOrganisation(user, editor?.permissions, bit)
                                    }
                                    onSave={(permissions) =>
                                        update.mutateAsync(
                                            {
                                                userId: member.user_id,
                                                permissions,
                                                elo: member.elo,
                                            },
                                            {
                                                onSuccess: () =>
                                                    toast.success(
                                                        t("organisations.manage.members.saved")
                                                    ),
                                            }
                                        )
                                    }
                                />
                            )}
                            <EloDialog
                                member={member}
                                onSave={(elo) =>
                                    update.mutateAsync(
                                        {
                                            userId: member.user_id,
                                            permissions: BigInt(member.permissions),
                                            elo,
                                        },
                                        {
                                            onSuccess: () =>
                                                toast.success(
                                                    t("organisations.manage.members.saved")
                                                ),
                                        }
                                    )
                                }
                            />
                            {canRemove && (
                                <ConfirmDialog
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive font-sans"
                                        >
                                            <Trash2 />
                                            {t("organisations.manage.members.remove")}
                                        </Button>
                                    }
                                    title={t("organisations.manage.members.removeTitle", {
                                        name: member.full_name,
                                    })}
                                    description={t(
                                        "organisations.manage.members.removeDescription"
                                    )}
                                    confirmLabel={t("organisations.manage.members.remove")}
                                    onConfirm={() =>
                                        remove.mutateAsync(member.user_id, {
                                            onSuccess: () =>
                                                toast.success(
                                                    t("organisations.manage.members.removed")
                                                ),
                                        })
                                    }
                                />
                            )}
                        </div>
                    );
                },
            },
        ],
        [t, organisation.owner, user, editor, canEditUsers, canRemove, update, remove]
    );

    return (
        <Section title={t("organisations.manage.members.title")} icon={Users}>
            <DataTable
                columns={columns}
                data={sorted}
                searchable
                searchPlaceholder={t("organisations.manage.members.search")}
                pageSize={25}
                getRowId={(member) => member.id.toString()}
                toolbar={canEditUsers && <AddMemberForm organisationId={organisation.id} />}
            />
        </Section>
    );
};

export const OrganisationManagePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { organisationId = "0" } = useParams<{ organisationId: string }>();
    const { data: organisation } = useSuspenseQuery(organisationQueries.detail(organisationId));
    const { data: members } = useSuspenseQuery(organisationQueries.members(organisationId));

    return (
        <div className="flex w-full flex-col gap-6">
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
                <ArrowLeft />
                {t("organisations.manage.back")}
            </Button>
            <PageHeader title={t("organisations.manage.title", { name: organisation.name })} />
            <InfoSection organisation={organisation} memberCount={members.length} />
            <MembersSection organisation={organisation} members={members} />
        </div>
    );
};
