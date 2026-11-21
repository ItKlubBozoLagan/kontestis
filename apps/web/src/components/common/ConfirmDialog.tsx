import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type Props = {
    /** The element opening the dialog (rendered with `asChild`). */
    trigger: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    confirmLabel?: ReactNode;
    destructive?: boolean;
    onConfirm: () => unknown | Promise<unknown>;
};

/** "Are you sure?" dialog. Awaits `onConfirm` before closing. */
export const ConfirmDialog = ({
    trigger,
    title,
    description,
    confirmLabel,
    destructive = true,
    onConfirm,
}: Props) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title ?? t("common.areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ?? t("common.cannotBeUndone")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={pending}
                        className={
                            destructive ? buttonVariants({ variant: "destructive" }) : undefined
                        }
                        onClick={async (event) => {
                            event.preventDefault();
                            setPending(true);

                            try {
                                await onConfirm();
                                setOpen(false);
                            } finally {
                                setPending(false);
                            }
                        }}
                    >
                        {confirmLabel ?? t("common.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
