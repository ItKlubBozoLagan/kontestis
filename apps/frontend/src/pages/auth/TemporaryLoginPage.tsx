import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { theme } from "twin.macro";
import { z } from "zod";

import { http, wrapAxios } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useTokenStore } from "../../state/token";

const FormData = z.object({
    username: z.string().min(1),
    password: z.string().min(1).max(1024),
});

export const TemporaryLoginPage: FC = () => {
    const { setToken } = useTokenStore();
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<z.infer<typeof FormData>>({
        resolver: zodResolver(FormData),
    });

    const onSubmit = handleSubmit(async (data) => {
        setError();
        setLoading(true);

        try {
            const result = await wrapAxios<{ token: string }>(
                http.post("/auth/temporary/login", data)
            );

            setToken(result.token);
        } catch {
            setError("Invalid username or password");
        } finally {
            setLoading(false);
        }
    });

    return (
        <div tw={"w-full md:max-w-[768px] mt-20"}>
            <TitledSection title={"Temporary User Login"}>
                <div tw={"w-full flex flex-col items-center justify-center gap-8 pb-12 pt-6"}>
                    {error && <span tw={"text-red-500 text-lg"}>{error}</span>}
                    <div tw={"w-full flex flex-col gap-6 items-center max-w-[256px]"}>
                        <form onSubmit={onSubmit} tw={"w-full"}>
                            <div tw={"flex flex-col gap-4 items-center w-full"}>
                                <TitledInput
                                    label={"Username:"}
                                    bigLabel
                                    tw={"pt-0 max-w-full"}
                                    placeholder={"temp_abc12def"}
                                    error={errors.username?.message}
                                    {...register("username")}
                                />
                                <TitledInput
                                    label={"Password:"}
                                    type={"password"}
                                    bigLabel
                                    tw={"pt-0 max-w-full"}
                                    placeholder={"\u2022".repeat(12)}
                                    error={errors.password?.message}
                                    {...register("password")}
                                />
                                <SimpleButton
                                    tw={"w-full"}
                                    color={theme`colors.red.300`}
                                    disabled={loading}
                                >
                                    Log in
                                </SimpleButton>
                            </div>
                        </form>
                        <span tw={"text-base text-center"}>
                            <Link to={"/"} tw={"text-sky-600"}>
                                Back to main login
                            </Link>
                        </span>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
