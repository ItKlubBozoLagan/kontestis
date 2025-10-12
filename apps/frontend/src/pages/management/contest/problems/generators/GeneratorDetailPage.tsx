import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSection } from "../../../../../components/TitledSection";
import { Translated } from "../../../../../components/Translated";
import { useGenerator } from "../../../../../hooks/problem/generator/useGenerator";
import { useUpdateGenerator } from "../../../../../hooks/problem/generator/useUpdateGenerator";
import { useTranslation } from "../../../../../hooks/useTranslation";

const UpdateGeneratorSchema = z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1),
    language: z.string(),
});

type Properties = {
    problemId: string;
    generatorId: string;
};

export const GeneratorDetailPage: FC = () => {
    const { problemId, generatorId } = useParams<Properties>();
    const { data: generator } = useGenerator([BigInt(problemId ?? 0), BigInt(generatorId ?? 0)]);
    const { mutate: updateGenerator, isSuccess, error } = useUpdateGenerator();
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<z.infer<typeof UpdateGeneratorSchema>>({
        resolver: zodResolver(UpdateGeneratorSchema),
    });

    useEffect(() => {
        if (generator) {
            reset({
                name: generator.name,
                code: generator.code,
                language: generator.language,
            });
        }
    }, [generator, reset]);

    const onSubmit = handleSubmit((data) => {
        updateGenerator([BigInt(problemId ?? 0), BigInt(generatorId ?? 0), data]);
    });

    const formReference = useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    return (
        <div tw={"w-full flex flex-col gap-6"}>
            <div tw={"text-2xl font-bold"}>Edit Generator: {generator?.name}</div>
            {isSuccess && <div tw={"text-sm text-green-500"}>Generator updated successfully!</div>}
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                {error && (
                    <span>
                        <Translated translationKey="errorMessages.withInfo">
                            {error.message}
                        </Translated>
                    </span>
                )}
            </div>
            <form onSubmit={onSubmit} ref={formReference}>
                <TitledSection title="Generator Settings">
                    <EditableDisplayBox
                        title="Generator Name"
                        value={generator?.name ?? ""}
                        submitFunction={submitForm}
                    >
                        <TitledInput {...register("name")} />
                    </EditableDisplayBox>
                    <EditableDisplayBox
                        title="Language"
                        value={generator?.language ?? ""}
                        submitFunction={submitForm}
                    >
                        <select
                            {...register("language")}
                            onChange={(event) => {
                                setValue("language", event.target.value);
                                submitForm();
                            }}
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
                    </EditableDisplayBox>
                    <EditableDisplayBox
                        title="Code"
                        value={generator?.code ?? ""}
                        submitFunction={submitForm}
                        largeTextValue
                    >
                        <textarea
                            {...register("code")}
                            tw={"w-full min-h-[400px] font-mono text-sm"}
                        />
                    </EditableDisplayBox>
                </TitledSection>
            </form>
        </div>
    );
};
