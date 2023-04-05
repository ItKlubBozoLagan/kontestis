import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useCreateProblem } from "../../../../hooks/problem/useCreateProblem";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../util/ModalStyles";

const CreateProblemSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    evaluation_script: z.string(),
    time_limit_millis: z.coerce.number(),
    memory_limit_megabytes: z.coerce.number(),
    solution_code: z.string(),
    solution_language: z.string(),
});

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
        },
    });

    const createMutation = useCreateProblem(contest.id);

    const queryClient = useQueryClient();

    const { t } = useTranslation();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate({
            ...data,
            evaluation_script:
                data.evaluation_script.trim().length > 0 ? data.evaluation_script : undefined,
            evaluation_variant: data.evaluation_script.trim().length > 0 ? "script" : "plain",
        });
    });

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
            style={ModalStyles}
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
                        tw={"w-full h-28 resize-none font-mono text-sm"}
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
                        {t("contests.management.individual.problems.createModal.evaluationScript")}
                    </span>
                    <textarea
                        tw={"w-full h-32 resize-none font-mono text-sm"}
                        {...register("evaluation_script")}
                    ></textarea>
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
                        tw={"w-full h-32 resize-none font-mono text-sm"}
                        {...register("solution_code")}
                    ></textarea>
                    <SimpleButton tw={"mt-2"}>
                        {t("contests.management.individual.problems.createModal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
