import { zodResolver } from "@hookform/resolvers/zod";
import { ProblemWithScore } from "@kontestis/models";
import { textToColor } from "@kontestis/utils";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckSquare, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { Breadcrumb } from "../../../../components/Breadcrumb";
import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useModifyProblem } from "../../../../hooks/problem/useCreateProblem";
import { useTranslation } from "../../../../hooks/useTranslation";
import { LimitBox } from "../../../problems/ProblemViewPage";

type Properties = {
    problem: ProblemWithScore;
};

const ModifyProblemSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    evaluation_script: z.string(),
    time_limit_millis: z.coerce.number(),
    memory_limit_megabytes: z.coerce.number(),
    solution_code: z.string(),
    solution_language: z.string(),
    tags: z.array(z.string()),
});

export const ProblemInfoSection: FC<Properties> = ({ problem }) => {
    const { contest } = useContestContext();

    const {
        setValue,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyProblemSchema>>({
        resolver: zodResolver(ModifyProblemSchema),
        defaultValues: {
            title: problem?.title ?? "",
            description: problem?.description ?? "",
            evaluation_script: problem?.evaluation_script ?? "",
            time_limit_millis: problem?.time_limit_millis ?? 0,
            memory_limit_megabytes: problem?.memory_limit_megabytes ?? 0,
            solution_language: problem?.solution_language ?? "",
            solution_code: problem?.solution_code ?? "",
        },
    });

    const modifyMutation = useModifyProblem(BigInt(problem?.id ?? 0));

    const queryClient = useQueryClient();

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();

        modifyMutation.mutate({
            ...data,
            evaluation_script:
                data.evaluation_script.trim().length > 0 ? data.evaluation_script : undefined,
            evaluation_variant: data.evaluation_script.trim().length > 0 ? "script" : "plain",
        });
    });

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "problems"]);
        queryClient.invalidateQueries(["problem", problem.id]);
        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    const [newTag, setNewTag] = useState("");

    return (
        <form tw={"w-full"} onSubmit={onSubmit} ref={formReference}>
            <TitledSection title={"Info"}>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.individual.info.name")}
                    value={problem.title}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("title")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.individual.info.description")}
                    value={problem.description}
                    submitFunction={submitForm}
                    largeTextValue
                >
                    <textarea {...register("description")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.individual.info.timeLimit")}
                    value={problem.time_limit_millis + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("time_limit_millis")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.individual.info.timeLimit")}
                    value={problem.memory_limit_megabytes + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("memory_limit_megabytes")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t(
                        "contests.management.individual.problems.individual.info.evaluationScript"
                    )}
                    value={
                        problem.evaluation_script ??
                        t("contests.management.individual.problems.individual.info.empty")
                    }
                    submitFunction={submitForm}
                    largeTextValue
                >
                    <textarea {...register("evaluation_script")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t(
                        "contests.management.individual.problems.individual.info.solutionLanguage"
                    )}
                    value={problem.solution_language + ""}
                    submitFunction={submitForm}
                >
                    <select
                        name="languages"
                        onChange={(event) => setValue("solution_language", event.target.value)}
                        defaultValue={problem.solution_language ?? ""}
                    >
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                    </select>
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t(
                        "contests.management.individual.problems.individual.info.solutionCode"
                    )}
                    value={
                        problem.solution_code ??
                        t("contests.management.individual.problems.individual.info.empty")
                    }
                    submitFunction={submitForm}
                    largeTextValue
                >
                    <textarea {...register("solution_code")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={"Tags"}
                    value={
                        <div tw={"flex gap-1 flex-wrap"}>
                            {(problem.tags ?? []).map((t) => (
                                <Breadcrumb key={t} color={textToColor(t)}>
                                    {t}
                                    <FiX
                                        tw={"hover:text-red-600 cursor-pointer"}
                                        onClick={() => {
                                            setValue(
                                                "tags",
                                                problem.tags.filter((tag) => tag != t)
                                            );
                                            submitForm();
                                        }}
                                    />
                                </Breadcrumb>
                            ))}
                        </div>
                    }
                    variant={"add"}
                    submitFunction={() => {
                        if (newTag.length === 0) return;

                        setValue("tags", [newTag, ...problem.tags]);
                        setNewTag("");
                        submitForm();
                    }}
                >
                    <TitledInput onChange={(event) => setNewTag(event.target.value)} />
                </EditableDisplayBox>
                <LimitBox icon={FiCheckSquare} title={"Score"} value={problem.score + ""} />
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                    {modifyMutation.error && (
                        <span>
                            <Translated translationKey="errorMessages.withInfo">
                                {modifyMutation.error.message}
                            </Translated>
                        </span>
                    )}
                </div>
            </TitledSection>
        </form>
    );
};
