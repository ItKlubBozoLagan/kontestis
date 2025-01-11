import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC } from "react";
import { useForm } from "react-hook-form";
import { theme } from "twin.macro";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";

const FormData = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(1024),
});

export const ManagedLoginForm: FC = () => {
    const { handleSubmit, register } = useForm<z.infer<typeof FormData>>({
        resolver: zodResolver(FormData),
    });

    const onSubmit = handleSubmit((data) => {
        console.log(data);
    });

    return (
        <div tw={"w-full"}>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col gap-4 items-center w-full"}>
                    <TitledInput
                        label={"Email"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"user@example.com"}
                        {...register("email")}
                    />
                    <TitledInput
                        label={"Password"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"\u2022".repeat(16)}
                        {...register("email")}
                    />
                    <SimpleButton tw={"w-full"} color={theme`colors.red.300`}>
                        Log in
                    </SimpleButton>
                </div>
            </form>
        </div>
    );
};
