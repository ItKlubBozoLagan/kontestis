import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { theme } from "twin.macro";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useRegister } from "../../hooks/auth/useRegister";
import { useTranslation } from "../../hooks/useTranslation";

const FormData = z.object({
    email: z.string().email(),
    full_name: z.string().min(4).max(1024),
    picture_url: z.string().max(1024).optional(),
    password: z.string().min(4).max(1024),
});

export const RegisterPage: FC = () => {
    const [error, setError] = useState<string>();

    const navigate = useNavigate();

    const registerMutation = useRegister({
        onError: (error) => {
            if (error.status === 409) setError("Email already in use");
            else setError("Something went wrong");
        },
        onSuccess: () => {
            navigate("/", {
                state: "logged-in",
            });
        },
    });

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<z.infer<typeof FormData>>({
        resolver: zodResolver(FormData),
        defaultValues: {
            picture_url: undefined,
        },
    });

    const onSubmit = handleSubmit((data) => {
        registerMutation.mutate(data);
    });

    const { t } = useTranslation();

    return (
        <div tw={"w-full md:max-w-[768px] mt-20"}>
            <TitledSection title={t("register.label")}>
                <div tw={"flex flex-col gap-6 justify-center items-center w-full p-12"}>
                    {error && <span tw={"text-red-500"}>{error}</span>}
                    <div tw={"w-full flex flex-col gap-6 items-center max-w-[300px]"}>
                        <form onSubmit={onSubmit} tw={"w-full"}>
                            <div tw={"flex flex-col gap-4 items-center w-full"}>
                                <TitledInput
                                    label={"Full name:"}
                                    bigLabel
                                    tw={"pt-0 max-w-full"}
                                    placeholder={"John Doe"}
                                    error={errors.full_name?.message}
                                    {...register("full_name")}
                                />
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
                                    disabled={registerMutation.isLoading}
                                >
                                    Register
                                </SimpleButton>
                            </div>
                        </form>
                        <span tw={"text-base text-center"}>
                            already have an account?{" "}
                            <Link to={"/"} tw={"text-sky-600"}>
                                login
                            </Link>
                        </span>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
