import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";

import { useJoinContest } from "@/api/contests";
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
import { useOrganisationStore } from "@/stores/organisation";

/** Join a contest by code; switches to the contest's organisation and opens it. */
export const JoinContestDialog = ({ variant = "default" }: { variant?: "default" | "outline" }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const select = useOrganisationStore((state) => state.select);
    const [open, setOpen] = useState(false);
    const join = useJoinContest();

    const schema = z.object({ code: z.string().trim().length(16, t("joinContest.length")) });
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { code: "" } });

    const onSubmit = form.handleSubmit(({ code }) =>
        join.mutate(code, {
            onSuccess: ({ contest_id, organisation_id }) => {
                setOpen(false);
                select(organisation_id);
                navigate(`/contest/${contest_id}`);
            },
            onError: () => form.setError("code", { message: t("joinContest.invalid") }),
        })
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant}>
                    <KeyRound />
                    {t("joinContest.button")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("joinContest.title")}</DialogTitle>
                    <DialogDescription>{t("joinContest.description")}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("joinContest.code")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoFocus
                                            className="font-mono"
                                            maxLength={16}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={join.isPending}>
                                {t("joinContest.submit")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
