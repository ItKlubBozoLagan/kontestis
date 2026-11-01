import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { HttpError } from "@/api/http";
import { useCreateOrganisation } from "@/api/organisations";
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

const schema = z.object({ name: z.string().trim().min(1).max(128) });

export const CreateOrganisationDialog = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const create = useCreateOrganisation();
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "" } });

    const onSubmit = form.handleSubmit((values) =>
        create.mutate(values, {
            onSuccess: () => {
                toast.success(t("organisations.create.created"));
                form.reset();
                setOpen(false);
            },
            onError: (error: HttpError) => {
                if (error.status === 409)
                    form.setError("name", { message: t("organisations.create.conflict") });
            },
        })
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    {t("organisations.select.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("organisations.create.title")}</DialogTitle>
                    <DialogDescription>{t("organisations.create.description")}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("organisations.create.name")}</FormLabel>
                                    <FormControl>
                                        <Input autoFocus {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={create.isPending}>
                                {t("organisations.create.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
