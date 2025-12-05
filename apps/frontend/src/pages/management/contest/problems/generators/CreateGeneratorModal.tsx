import { zodResolver } from "@hookform/resolvers/zod";
import { Snowflake } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledTextArea } from "../../../../../components/TitledTextArea";
import { Translated } from "../../../../../components/Translated";
import { useCreateGenerator } from "../../../../../hooks/problem/generator/useCreateGenerator";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../util/ModalStyles";

const CreateGeneratorSchema = z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1),
    language: z.string(),
});

type Properties = {
    problemId: Snowflake;
};

export const CreateGeneratorModal: FC<Modal.Props & Properties> = ({
    problemId,
    ...properties
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateGeneratorSchema>>({
        resolver: zodResolver(CreateGeneratorSchema),
        defaultValues: {
            language: "python",
            code: "",
            name: "",
        },
    });

    const createMutation = useCreateGenerator(problemId);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate(data);
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    const { t } = useTranslation();

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create Generator Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl font-bold"}>Create Generator</div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                {createMutation.error && (
                    <span>
                        <Translated translationKey="errorMessages.withInfo">
                            {createMutation.error.message}
                        </Translated>
                    </span>
                )}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-3"}>
                    <TitledInput
                        bigLabel
                        label="Generator Name"
                        tw={"max-w-full"}
                        {...register("name")}
                    />
                    <div tw={"flex flex-col gap-2"}>
                        <label htmlFor="language-select-create" tw={"text-base"}>
                            Language
                        </label>
                        <select
                            id="language-select-create"
                            {...register("language")}
                            tw={
                                "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                            }
                        >
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="java">Java</option>
                        </select>
                    </div>
                    <TitledTextArea
                        bigLabel
                        label="Code"
                        tw={"max-w-full min-h-[200px]"}
                        {...register("code")}
                    />
                    <SimpleButton type={"submit"} tw={"w-full"}>
                        Create
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
