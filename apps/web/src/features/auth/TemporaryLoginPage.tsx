import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";

import { useTemporaryLogin } from "@/api/auth";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/features/auth/AuthCard";

const schema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1).max(1024),
});

export const TemporaryLoginPage = () => {
    const { t } = useTranslation();
    const login = useTemporaryLogin();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { username: "", password: "" },
    });

    return (
        <AuthCard
            title={t("auth.temporary.title")}
            description={t("auth.temporary.subtitle")}
            footer={
                <Link to="/login" className="text-primary hover:underline">
                    {t("auth.temporary.back")}
                </Link>
            }
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((values) => login.mutate(values))}
                    className="mx-auto flex w-full max-w-sm flex-col gap-4 py-2"
                >
                    {login.isError && (
                        <Alert variant="destructive" icon={CircleAlert}>
                            {t("auth.temporary.invalid")}
                        </Alert>
                    )}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("auth.temporary.username")}</FormLabel>
                                <FormControl>
                                    <Input
                                        autoComplete="username"
                                        placeholder="nap_jdoe"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("auth.fields.password")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        autoComplete="current-password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={login.isPending}>
                        {t("auth.login.submit")}
                    </Button>
                </form>
            </Form>
        </AuthCard>
    );
};
