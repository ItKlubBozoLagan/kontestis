import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { useRegister } from "@/api/auth";
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
import { CaptchaProvider } from "@/features/auth/CaptchaProvider";
import { useCaptcha } from "@/hooks/useCaptcha";

const schema = z.object({
    full_name: z.string().trim().min(4).max(128),
    email: z.email(),
    password: z.string().min(4).max(1024),
});

const RegisterForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const getCaptcha = useCaptcha();
    const register = useRegister();
    const [error, setError] = useState<string | null>(null);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { full_name: "", email: "", password: "" },
    });

    const onSubmit = form.handleSubmit(async (values) => {
        setError(null);

        let captcha: string;

        try {
            captcha = await getCaptcha();
        } catch {
            return setError(t("auth.login.errors.captchaUnavailable"));
        }

        register.mutate(
            { ...values, captcha },
            {
                onSuccess: () => navigate("/login", { state: { registered: true } }),
                onError: (error) =>
                    setError(
                        error.status === 409
                            ? t("auth.register.errors.conflict")
                            : error.status === 403
                            ? t("auth.login.errors.captcha")
                            : t("auth.login.errors.generic")
                    ),
            }
        );
    });

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 py-2">
                {error && (
                    <Alert variant="destructive" icon={CircleAlert}>
                        {error}
                    </Alert>
                )}
                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("auth.register.fullName")}</FormLabel>
                            <FormControl>
                                <Input autoComplete="name" placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("auth.fields.email")}</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="user@example.com"
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
                                <Input type="password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={register.isPending}>
                    {t("auth.register.submit")}
                </Button>
            </form>
        </Form>
    );
};

export const RegisterPage = () => {
    const { t } = useTranslation();

    return (
        <CaptchaProvider>
            <AuthCard
                title={t("auth.register.title")}
                description={t("auth.register.subtitle")}
                footer={
                    <>
                        {t("auth.register.haveAccount")}{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            {t("auth.register.login")}
                        </Link>
                    </>
                }
            >
                <RegisterForm />
            </AuthCard>
        </CaptchaProvider>
    );
};
