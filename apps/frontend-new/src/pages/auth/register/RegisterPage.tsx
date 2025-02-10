import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

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
import { withCaptcha } from "@/hoc/withCaptcha";
import { useRegister } from "@/hooks/auth/useRegister";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const formSchema = z
    .object({
        email: z.string().email({
            message: "Invalid email address.",
        }),
        full_name: z
            .string()
            .min(4, {
                message: "Full name must be at least 4 characters long.",
            })
            .max(1024, {
                message: "Full name is too long.",
            }),
        picture_url: z
            .string()
            .max(1024, {
                message: "Picture URL is too long.",
            })
            .optional(),
        password: z
            .string()
            .min(4, {
                message: "Password must be at least 4 characters long.",
            })
            .max(1024, {
                message: "Password is too long.",
            }),
        confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

const RegisterPageBase: FC = () => {
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            full_name: "",
            picture_url: undefined,
            password: "",
            confirm_password: "",
        },
    });

    const navigate = useNavigate();

    const { toast } = useToast();

    const registerMutation = useRegister({
        onError: (error) => {
            if (error.status === 409)
                toast({
                    variant: "destructive",
                    title: "Failed to create account!",
                    description: "Email already in use.",
                });
            else if (error.status === 403)
                toast({
                    variant: "destructive",
                    title: "Failed to create account!",
                    description: "Couldn't verify captcha.",
                });
            else
                toast({
                    variant: "destructive",
                    title: "Something went wrong!",
                });
        },
        onSuccess: () => {
            toast({
                variant: "success",
                title: "Success!",
                description: "Registered successfully! Verify your email before logging in.",
            });
            navigate("/");
        },
    });

    const { executeRecaptcha } = useGoogleReCaptcha();

    const onSubmit = form.handleSubmit((data) => {
        if (!executeRecaptcha) {
            return;
        }

        executeRecaptcha()
            .then((token) => registerMutation.mutate({ data, captcha_token: token }))
            .catch(console.error);
    });

    return (
        <Card className={"w-[356px]"}>
            <CardHeader>
                <CardTitle>Register</CardTitle>
            </CardHeader>
            <CardContent className={"w-full flex flex-col justify-center"}>
                <div className={"w-full"}>
                    <Form {...form}>
                        <form
                            action="#"
                            className={"flex flex-col items-stretch gap-4 h-full justify-center"}
                            onSubmit={onSubmit}
                        >
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
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
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="someone@kontestis.ac" {...field} />
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
                            <FormField
                                control={form.control}
                                name="confirm_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm password</FormLabel>
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
                            <Button disabled={registerMutation.isLoading} type={"submit"}>
                                {t("register.label")}
                            </Button>
                        </form>
                    </Form>
                </div>
                <span className={"w-full text-center mt-4"}>
                    or{" "}
                    <Link className={"text-blue-400"} to={"/"}>
                        login
                    </Link>
                </span>
            </CardContent>
        </Card>
    );
};

export const RegisterPage = withCaptcha(RegisterPageBase);
