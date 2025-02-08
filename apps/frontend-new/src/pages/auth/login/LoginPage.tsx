import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { FC, useCallback } from "react";
import { useForm } from "react-hook-form";
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
import { useTranslation } from "@/hooks/useTranslation";
import { useTokenStore } from "@/state/token";

const formSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters long.",
    }),
    password: z.string().min(2, {
        message: "Password must be at least 2 characters long.",
    }),
});

const LoginPageBase: FC = () => {
    const { setToken } = useTokenStore();
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = form.handleSubmit((data) => {
        console.log(data);
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
                <div className={"basis-1/2 flex flex-col items-center justify-center"}>
                    <div className={"w-flex w-full"}>
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
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="someone" {...field} />
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
                                                    placeholder={"\u2022".repeat(16)}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type={"submit"}>{t("login.label")}</Button>
                            </form>
                        </Form>
                    </div>
                </div>
                <div className={"flex gap-4 items-center justify-center w-full"}>
                    <Separator className={"shrink"} />
                    <span>or</span>
                    <Separator className={"shrink"} />
                </div>
                <div className={"flex flex-col gap-6 items-center w-full basis-1/2"}>
                    <div className={"flex flex-col flex-grow gap-6 items-center justify-center"}>
                        <GoogleLogin
                            onSuccess={onGoogleLoginSuccess}
                            width={"256px"}
                            size={"large"}
                            text={"signin"}
                            theme={"filled_blue"}
                            shape={"rectangular"}
                            auto_select={true}
                        />
                        <AaiEduButton purpose={"login"} />
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
