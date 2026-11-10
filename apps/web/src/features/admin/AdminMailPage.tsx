import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { useSendMail } from "@/api/notifications";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
    subject: z.string().trim().min(1),
    text: z.string().trim().min(1),
    contestAnnouncement: z.boolean(),
    debugMode: z.boolean(),
});

const defaults = { subject: "", text: "", contestAnnouncement: false, debugMode: true };

export const AdminMailPage = () => {
    const { t } = useTranslation();
    const sendMail = useSendMail();
    const form = useForm({ resolver: zodResolver(schema), defaultValues: defaults });
    const [debugMode, subject, text] = form.watch(["debugMode", "subject", "text"]);

    const send = form.handleSubmit((values) =>
        sendMail.mutateAsync(values, {
            onSuccess: () => {
                form.reset(defaults);
                toast.success(t("admin.mail.sent"));
            },
        })
    );

    return (
        <Section title={t("admin.mail.title")} icon={Mail} className="mx-auto max-w-3xl">
            <Form {...form}>
                <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
                    <p className="text-muted-foreground text-sm">{t("admin.mail.description")}</p>
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("admin.mail.subject")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("admin.mail.text")}</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-48" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(["contestAnnouncement", "debugMode"] as const).map((name) => (
                            <FormField
                                key={name}
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <FormItem className="flex items-start gap-3 rounded-md border p-3">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="flex flex-col gap-1">
                                            <FormLabel>{t(`admin.mail.${name}`)}</FormLabel>
                                            <FormDescription>
                                                {t(`admin.mail.${name}Hint`)}
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <ConfirmDialog
                        trigger={
                            <Button
                                type="button"
                                className="self-end"
                                variant={debugMode ? "default" : "destructive"}
                                disabled={sendMail.isPending || !subject.trim() || !text.trim()}
                            >
                                <Send />
                                {t("admin.mail.send")}
                            </Button>
                        }
                        title={t("admin.mail.confirmTitle")}
                        description={`${t("admin.mail.confirmDescription")}${
                            debugMode ? ` ${t("admin.mail.confirmDebug")}` : ""
                        }`}
                        confirmLabel={t("admin.mail.send")}
                        destructive={!debugMode}
                        onConfirm={send}
                    />
                </form>
            </Form>
        </Section>
    );
};
