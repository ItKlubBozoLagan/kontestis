import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { Lock, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { z } from "zod";

import { useAaiEduUrl, useGoogleLogin, useManagedLogin } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/i18n";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const location = useLocation();
    const { t } = useTranslation();
    const searchParameters = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [error, setError] = useState<string>();

    const googleLoginMutation = useGoogleLogin();
    const managedLoginMutation = useManagedLogin();

    const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;

        googleLoginMutation.mutate(
            { credential: credentialResponse.credential },
            {
                onError: (error_) => setError(error_.message),
            }
        );
    };

    const onSubmit = async (data: LoginFormData) => {
        setError(undefined);
        managedLoginMutation.mutate(data, {
            onError: (error_) => setError(error_.message),
        });
    };

    const { data: aaiEduUrl } = useAaiEduUrl("login");

    const onAaiEduClick = () => {
        if (!aaiEduUrl?.url) return;

        window.location.href = aaiEduUrl.url;
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm text-center">
                        Login
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Status Messages */}
                    {location.state === "logged-in" && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-700 dark:text-green-400 text-sm text-center">
                            Registered successfully! Verify your email before logging in.
                        </div>
                    )}
                    {searchParameters.has("confirmed") && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-700 dark:text-green-400 text-sm text-center">
                            E-mail confirmed, you can log in now!
                        </div>
                    )}
                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Google Login */}
                    {hasGoogleClientId && (
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={onGoogleLoginSuccess}
                                onError={() => setError("Google login failed")}
                                width="300"
                                text="signin_with"
                                theme="outline"
                                shape="rectangular"
                                auto_select
                            />
                        </div>
                    )}

                    {/* AAI@EduHr Login */}
                    <div
                        className="flex items-center justify-center gap-2 border border-border rounded px-4 py-3 cursor-pointer hover:bg-muted transition-colors mx-auto w-[300px]"
                        onClick={onAaiEduClick}
                    >
                        <img src="/aai-edu.svg" alt="AAI@EduHR" className="h-6" />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
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
                            <Label htmlFor="password">Password</Label>
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

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || managedLoginMutation.isPending}
                        >
                            {managedLoginMutation.isPending ? "..." : t("login.label")}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link to="/register" className="font-medium text-primary hover:underline">
                            {t("register.label")}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
