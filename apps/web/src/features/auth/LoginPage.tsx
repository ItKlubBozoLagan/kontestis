import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "react-router";
import { z } from "zod";

import { useGoogleLogin, useManagedLogin } from "@/api/auth";
import { HttpError } from "@/api/http";
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
import { Separator } from "@/components/ui/separator";
import { AaiEduButton } from "@/features/auth/AaiEduButton";
import { AuthCard } from "@/features/auth/AuthCard";
import { CaptchaProvider } from "@/features/auth/CaptchaProvider";
import { useCaptcha } from "@/hooks/useCaptcha";

const schema = z.object({
    email: z.email(),
    password: z.string().min(4).max(1024),
});

const EmailLoginForm = ({ onError }: { onError: (message: string | null) => void }) => {
    const { t } = useTranslation();
    const getCaptcha = useCaptcha();
    const login = useManagedLogin();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = form.handleSubmit(async (values) => {
        onError(null);

        let captcha: string;

        try {
            captcha = await getCaptcha();
        } catch {
            return onError(t("auth.login.errors.captchaUnavailable"));
        }

        login.mutate(
            { ...values, captcha },
            {
                onError: (error: HttpError) => {
                    if (error.status === 401) return onError(t("auth.login.errors.invalid"));

                    if (error.status === 403) return onError(t("auth.login.errors.captcha"));

                    if (error.status === 422)
                        return onError(
                            error.message === "verification-repeat"
                                ? t("auth.login.verificationResent")
                                : t("auth.login.errors.unverified")
                        );

                    onError(t("auth.login.errors.generic"));
                },
            }
        );
    });

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
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
                                <Input type="password" autoComplete="current-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={login.isPending} className="w-full">
                    {t("auth.login.submit")}
                </Button>
            </form>
        </Form>
    );
};

export const LoginPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [params] = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const googleLogin = useGoogleLogin();

    const registered = (location.state as { registered?: boolean } | null)?.registered;

    return (
        <CaptchaProvider>
            <AuthCard
                title={t("auth.login.title")}
                description={t("auth.login.subtitle")}
                footer={
                    <Link to="/temp-login" className="text-primary hover:underline">
                        {t("auth.login.temporary")}
                    </Link>
                }
            >
                <div className="flex flex-col gap-4">
                    {registered && (
                        <Alert variant="success" icon={CheckCircle2}>
                            {t("auth.login.registered")}
                        </Alert>
                    )}
                    {params.has("confirmed") && (
                        <Alert variant="success" icon={CheckCircle2}>
                            {t("auth.login.confirmed")}
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="destructive" icon={CircleAlert}>
                            {error}
                        </Alert>
                    )}
                    <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
                        <div className="flex flex-1 flex-col items-center gap-4 py-2">
                            <span className="text-muted-foreground text-sm font-medium">
                                {t("auth.login.withEmail")}
                            </span>
                            <EmailLoginForm onError={setError} />
                            <span className="text-sm">
                                {t("auth.login.noAccount")}{" "}
                                <Link to="/register" className="text-primary hover:underline">
                                    {t("auth.login.register")}
                                </Link>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col">
                            <Separator className="flex-1 md:hidden" />
                            <Separator orientation="vertical" className="hidden flex-1 md:block" />
                            <span className="text-muted-foreground text-xs uppercase">
                                {t("auth.login.or")}
                            </span>
                            <Separator className="flex-1 md:hidden" />
                            <Separator orientation="vertical" className="hidden flex-1 md:block" />
                        </div>
                        <div className="flex flex-1 flex-col items-center gap-4 py-2">
                            <span className="text-muted-foreground text-sm font-medium">
                                {t("auth.login.withSso")}
                            </span>
                            <div className="flex flex-1 flex-col items-center justify-center gap-4">
                                {import.meta.env.VITE_OAUTH_CLIENT_ID && (
                                    <GoogleLogin
                                        onSuccess={({ credential }) =>
                                            credential && googleLogin.mutate(credential)
                                        }
                                        onError={() => setError(t("auth.login.errors.generic"))}
                                        width="256"
                                        size="large"
                                        text="signin"
                                        theme="outline"
                                        shape="rectangular"
                                    />
                                )}
                                <AaiEduButton purpose="login" />
                            </div>
                        </div>
                    </div>
                </div>
            </AuthCard>
        </CaptchaProvider>
    );
};
