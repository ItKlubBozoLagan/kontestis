import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useRegister } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";

const registerSchema = z
    .object({
        full_name: z.string().min(4, "Full name must be at least 4 characters").max(1024),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(4, "Password must be at least 4 characters").max(1024),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPageContent() {
    const navigate = useNavigate();
    const [error, setError] = useState<string>();
    const { t } = useTranslation();
    const { executeRecaptcha } = useGoogleReCaptcha();

    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setError(undefined);

        if (!executeRecaptcha) {
            setError("Failed to load captcha");

            return;
        }

        try {
            const captchaToken = await executeRecaptcha();

            registerMutation.mutate(
                {
                    email: data.email,
                    full_name: data.full_name,
                    password: data.password,
                    captcha_token: captchaToken,
                },
                {
                    onSuccess: () => {
                        navigate("/", { state: "logged-in" });
                    },
                    onError: (error_) => {
                        if (error_.message.includes("409")) {
                            setError("Email already in use");
                        } else if (error_.message.includes("403")) {
                            setError("Captcha verification failed");
                        } else {
                            setError(error_.message || "Something went wrong");
                        }
                    },
                }
            );
        } catch {
            setError("Captcha verification failed");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm text-center">
                        Register
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">{t("register.fullName")}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="full_name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-9"
                                    {...register("full_name")}
                                />
                            </div>
                            {errors.full_name && (
                                <p className="text-sm text-destructive">
                                    {errors.full_name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t("register.email")}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-9"
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{t("register.password")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    {...register("confirmPassword")}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || registerMutation.isPending}
                        >
                            {registerMutation.isPending ? "..." : t("register.label")}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        {t("register.haveAccount")}{" "}
                        <Link to="/" className="font-medium text-primary hover:underline">
                            {t("login.label")}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export function RegisterPage() {
    const hasCaptchaSiteKey = Boolean(import.meta.env.VITE_CAPTCHA_SITE_KEY);

    if (!hasCaptchaSiteKey) {
        return <RegisterPageContent />;
    }

    return (
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}>
            <RegisterPageContent />
        </GoogleReCaptchaProvider>
    );
}
