import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { theme } from "twin.macro";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { useLogin } from "../../hooks/auth/useLogin";
import { useTokenStore } from "../../state/token";

const FormData = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(1024),
});

type Properties = {
    onError: (error: string | undefined) => void;
    onEmailResent: () => void;
};

export const ManagedLoginForm: FC<Properties> = ({ onError, onEmailResent }) => {
    const { setToken } = useTokenStore();

    const loginMutation = useLogin({
        onError: (error) => {
            if (error.status === 401) onError("Invalid email or password");
            else if (error.status === 422) {
                if (error.message === "verification-repeat") onEmailResent();
                else onError("Email not verified");
            } else onError("Something went wrong");
        },
        onSuccess: (data) => {
            setToken(data.token);
        },
    });

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<z.infer<typeof FormData>>({
        resolver: zodResolver(FormData),
    });

    const onSubmit = handleSubmit((data) => {
        loginMutation.mutate(data);
    });

    return (
        <div tw={"w-full flex flex-col gap-6 items-center max-w-[256px]"}>
            <form onSubmit={onSubmit} tw={"w-full"}>
                <div tw={"flex flex-col gap-4 items-center w-full"}>
                    <TitledInput
                        label={"Email:"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"user@example.com"}
                        error={errors.email?.message}
                        {...register("email")}
                    />
                    <TitledInput
                        label={"Password:"}
                        type={"password"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"\u2022".repeat(16)}
                        error={errors.password?.message}
                        {...register("password")}
                    />
                    <SimpleButton
                        tw={"w-full"}
                        color={theme`colors.red.300`}
                        disabled={loginMutation.isLoading}
                    >
                        Log in
                    </SimpleButton>
                </div>
            </form>
            <span tw={"text-base text-center"}>
                don&apos;t have an account?{" "}
                <Link to={"/register"} tw={"text-sky-600"}>
                    register
                </Link>
            </span>
        </div>
    );
};
