import { grantPermission, hasPermission, type PermissionData, removePermission } from "permissio";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Props<K extends string> = {
    trigger: ReactNode;
    /** Display name of the user being edited. */
    name: string;
    /** Permission names in bit order, e.g. `AdminPermissionNames`. */
    names: readonly K[];
    /** The enum object, used to resolve bit positions (`AdminPermissions`). */
    bits: Record<K, number>;
    value: PermissionData;
    onSave: (permissions: bigint) => Promise<unknown>;
    disabled?: boolean;
    extra?: ReactNode;
    /** Permissions the editor may toggle; others are shown read-only (defaults to all). */
    canGrant?: (bit: number) => boolean;
};

/** Checkbox editor for a permissio bitset (site, organisation or contest permissions). */
export function PermissionsDialog<K extends string>({
    trigger,
    name,
    names,
    bits,
    value,
    onSave,
    disabled,
    extra,
    canGrant = () => true,
}: Props<K>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<bigint>(BigInt(value));
    const [saving, setSaving] = useState(false);

    const toggle = (bit: number, checked: boolean) =>
        setDraft((previous) =>
            BigInt(checked ? grantPermission(previous, bit) : removePermission(previous, bit))
        );

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) setDraft(BigInt(value));
            }}
        >
            <DialogTrigger asChild disabled={disabled}>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("permissions.title")}</DialogTitle>
                    <DialogDescription>{t("permissions.description", { name })}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {names.map((permission) => {
                        const bit = bits[permission];
                        const id = `permission-${permission}`;

                        return (
                            <Label
                                key={permission}
                                htmlFor={id}
                                className="hover:bg-muted flex items-center gap-2 rounded-md border px-2.5 py-2 font-normal"
                            >
                                <Checkbox
                                    id={id}
                                    checked={hasPermission(draft, bit)}
                                    disabled={!canGrant(bit)}
                                    onCheckedChange={(checked) => toggle(bit, checked === true)}
                                />
                                {t(`permissions.names.${permission}` as "permissions.names.ADMIN", {
                                    defaultValue: permission,
                                })}
                            </Label>
                        );
                    })}
                </div>
                <p className="text-muted-foreground text-xs">{t("permissions.admin")}</p>
                {extra}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        disabled={saving}
                        onClick={async () => {
                            setSaving(true);

                            try {
                                await onSave(draft);
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
}
