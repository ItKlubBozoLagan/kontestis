import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSwitch } from "../../../../components/TitledSwitch";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useCreateProblem } from "../../../../hooks/problem/useCreateProblem";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../util/ModalStyles";

const CreateProblemSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    evaluation_variant: z.string(),
    evaluation_language: z.string(),
    evaluation_script: z.string(),
    time_limit_millis: z.coerce.number(),
    memory_limit_megabytes: z.coerce.number(),
    solution_code: z.string(),
    solution_language: z.string(),
    tags: z.array(z.string()),
});

const DEFAULT_CHECKER = `
def read_until(separator):
    out = ""
    while True:
        line = input()
        if line == separator:
            return out
        out += " " + line.strip()

while True:
    separator = input()
    if len(separator.strip()) > 0:
        break

read_until(separator)
out = read_until(separator)
subOut = read_until(separator)

print("AC" if out.strip() == subOut.strip() else "WA")

`;

export const CreateProblemModal: FC<Modal.Props> = ({ ...properties }) => {
    const { contest } = useContestContext();

    const {
        setValue,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateProblemSchema>>({
        resolver: zodResolver(CreateProblemSchema),
        defaultValues: {
            solution_language: "python",
            evaluation_variant: "plain",
            evaluation_language: "python",
            evaluation_script: DEFAULT_CHECKER,
            tags: [],
        },
    });

    const createMutation = useCreateProblem(contest.id);

    const queryClient = useQueryClient();

    const { t } = useTranslation();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate(data);
    });

    const [variant, setVariant] = useState("plain");

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "problems"]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create problem Modal"}
            style={{ ...ModalStyles, content: { ...ModalStyles.content, top: "6%" } }}
        >
            <div tw={"text-xl"}>
                <Translated translationKey="contests.management.individual.problems.createModal.title">
                    <span tw={"font-bold"}>{contest.name}</span>
                </Translated>
            </div>
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
                <div tw={"flex flex-col items-stretch gap-2 p-1"}>
                    <TitledInput
                        bigLabel
                        label={t("contests.management.individual.problems.createModal.name")}
                        tw={"max-w-full"}
                        {...register("title")}
                    />
                    <span tw={"mt-2"}>
                        {t("contests.management.individual.problems.createModal.statement")}
                    </span>
                    <textarea
                        tw={"w-full h-24 resize-none font-mono text-sm"}
                        {...register("description")}
                    ></textarea>
                    <div tw={"flex gap-2"}>
                        <TitledInput
                            bigLabel
                            label={
                                t("contests.management.individual.problems.createModal.timeLimit") +
                                " (ms)"
                            }
                            {...register("time_limit_millis")}
                        />
                        <TitledInput
                            bigLabel
                            label={
                                t("contests.management.individual.problems.createModal.timeLimit") +
                                " (MiB)"
                            }
                            {...register("memory_limit_megabytes")}
                        />
                    </div>

                    <span tw={"mt-2"}>
                        {t(
                            "contests.management.individual.problems.createModal.evaluationVariant.label"
                        )}
                    </span>
                    <TitledSwitch
                        choice={["Plain", "Checker"]}
                        onChange={(value) => {
                            setValue("evaluation_variant", value === "Plain" ? "plain" : "checker");
                            setVariant(value === "Plain" ? "plain" : "checker");
                        }}
                    />
                    {variant !== "plain" && (
                        <div tw={"flex flex-col gap-2"}>
                            <TitledSwitch
                                choice={["Standard", "Interactive"]}
                                defaultIndex={0}
                                onChange={(value) => {
                                    setValue(
                                        "evaluation_variant",
                                        value === "Standard" ? "checker" : "interactive"
                                    );
                                    setVariant(value === "Standard" ? "checker" : "interactive");
                                }}
                            />
                            <span tw={"mt-2"}>
                                {t(
                                    "contests.management.individual.problems.createModal.evaluationLanguage"
                                )}
                            </span>
                            <select
                                name={"evaluation_language"}
                                onChange={(event) => {
                                    setValue("evaluation_language", event.target.value);
                                }}
                            >
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                            <span tw={"mt-2"}>
                                {t(
                                    "contests.management.individual.problems.createModal.evaluationScript"
                                )}
                            </span>
                            <textarea
                                tw={"w-full h-24 resize-none font-mono text-sm"}
                                {...register("evaluation_script")}
                            ></textarea>
                        </div>
                    )}
                    <span tw={"mt-2"}>
                        {t("contests.management.individual.problems.createModal.solutionLanguage")}
                    </span>
                    <select
                        name="languages"
                        onChange={(event) => setValue("solution_language", event.target.value)}
                    >
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                    </select>
                    <span tw={"mt-2"}>
                        {t("contests.management.individual.problems.createModal.solutionCode")}
                    </span>
                    <textarea
                        tw={"w-full h-24 resize-none font-mono text-sm"}
                        {...register("solution_code")}
                    ></textarea>
                </div>
                <SimpleButton tw={"mt-2"}>
                    {t("contests.management.individual.problems.createModal.createButton")}
                </SimpleButton>
            </form>
        </Modal>
    );
};
