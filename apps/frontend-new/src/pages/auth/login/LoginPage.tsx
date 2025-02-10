import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { FC, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { http, ServerData } from "@/api/http";
import { AaiEduButton } from "@/components/AaiEduButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLogin } from "@/hooks/auth/useLogin";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useTokenStore } from "@/state/token";

const formSchema = z.object({
    email: z.string().email({
        message: "Invalid email address.",
    }),
    password: z
        .string()
        .min(4, {
            message: "Password must be at least 4 characters long.",
        })
        .max(1024, {
            message: "Password is too long.",
        }),
});

const LoginPageBase: FC = () => {
    const { setToken } = useTokenStore();
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { toast } = useToast();

    const searchParameters = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const loginMutation = useLogin({
        onError: (error) => {
            if (error.status === 401)
                toast({
                    variant: "destructive",
                    title: "Login failed!",
                    description: "Invalid email or password.",
                });
            else if (error.status === 422) {
                if (error.message === "verification-repeat")
                    toast({
                        variant: "destructive",
                        title: "Login failed!",
                        description: "E-Mail not verified! Check your inbox.",
                    });
                else
                    toast({
                        variant: "destructive",
                        title: "Login failed!",
                        description: "E-Mail not verified!",
                    });
            } else
                toast({
                    variant: "destructive",
                    title: "Something went wrong!",
                });
        },
        onSuccess: (data) => {
            setToken(data.token);
        },
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (!searchParameters.has("confirmed")) return;

        // next tick
        setTimeout(() =>
            toast({
                variant: "success",
                title: "E-Mail confirmed!",
                description: "You can log in now.",
            })
        );

        searchParameters.delete("confirmed");
        navigate({
            search: searchParameters.toString(),
        });
    }, [searchParameters]);

    const onSubmit = form.handleSubmit((data) => {
        loginMutation.mutate(data);
    });

    const onGoogleLoginSuccess = useCallback((credentialResponse: CredentialResponse) => {
        const { credential } = credentialResponse;

        if (!credential) return;

        http.post<ServerData<{ token: string }>>("/auth/google-login", credentialResponse).then(
            (data) => setToken(data.data.data.token)
        );
    }, []);

    return (
        <Card className={"w-[356px]"}>
            <CardHeader>
                <CardTitle>Log in</CardTitle>
            </CardHeader>
            <CardContent className={"w-full flex flex-col gap-8"}>
                <div className={"flex flex-col items-center justify-center"}>
                    <div className={"w-full"}>
                        <Form {...form}>
                            <form
                                action="#"
                                className={
                                    "flex flex-col items-stretch gap-4 h-full justify-center"
                                }
                                onSubmit={onSubmit}
                            >
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>E-Mail</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="someone@kontestis.ac"
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
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type={"password"}
                                                    placeholder={"\u2022".repeat(16)}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button disabled={loginMutation.isLoading} type={"submit"}>
                                    {t("login.label")}
                                </Button>
                            </form>
                        </Form>
                    </div>
                    <span className={"w-full text-center mt-4"}>
                        or{" "}
                        <Link className={"text-blue-400"} to={"/register"}>
                            register
                        </Link>
                    </span>
                </div>
                <div className={"flex gap-4 items-center justify-center w-full"}>
                    <Separator className={"shrink"} />
                    <span>or</span>
                    <Separator className={"shrink"} />
                </div>
                <div className={"flex flex-col gap-6 items-center w-full"}>
                    <div className={"flex flex-col flex-grow gap-6 items-center justify-center"}>
                        <AaiEduButton purpose={"login"} />
                        <GoogleLogin
                            onSuccess={onGoogleLoginSuccess}
                            width={"256px"}
                            size={"large"}
                            text={"signin_with"}
                            theme={"outline"}
                            shape={"rectangular"}
                            auto_select={true}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const LoginPage: FC = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CLIENT_ID}>
        <LoginPageBase />
    </GoogleOAuthProvider>
);
