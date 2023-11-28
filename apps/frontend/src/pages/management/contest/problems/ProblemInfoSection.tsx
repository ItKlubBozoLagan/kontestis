import { zodResolver } from "@hookform/resolvers/zod";
import { ProblemWithScore } from "@kontestis/models";
import { textToHexColor } from "@kontestis/utils";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckSquare, FiX } from "react-icons/all";
import { z } from "zod";

import { Breadcrumb } from "../../../../components/Breadcrumb";
import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { TitledSwitch } from "../../../../components/TitledSwitch";
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
    evaluation_language: z.string(),
    evaluation_variant: z.string(),
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
            evaluation_variant: problem.evaluation_variant,
            evaluation_language: problem.evaluation_language ?? "python",
            tags: problem?.tags ?? [],
        },
    });

    const modifyMutation = useModifyProblem([contest.id, BigInt(problem?.id ?? 0)]);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();

        modifyMutation.mutate(data);
    });

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const [variant, setVariant] = useState(problem.evaluation_variant);

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
                    title={t(
                        "contests.management.individual.problems.individual.info.evaluationVariant.label"
                    )}
                    value={problem.evaluation_variant}
                    submitFunction={submitForm}
                >
                    <TitledSwitch
                        choice={[
                            t(
                                "contests.management.individual.problems.individual.info.evaluationVariant.plain"
                            ),
                            t(
                                "contests.management.individual.problems.individual.info.evaluationVariant.checker"
                            ),
                            t(
                                "contests.management.individual.problems.individual.info.evaluationVariant.outputOnly"
                            ),
                        ]}
                        defaultIndex={variant === "plain" ? 0 : variant === "checker" ? 1 : 2}
                        onChange={(value) => {
                            const result =
                                value ===
                                t(
                                    "contests.management.individual.problems.individual.info.evaluationVariant.plain"
                                )
                                    ? "plain"
                                    : value ===
                                      t(
                                          "contests.management.individual.problems.individual.info.evaluationVariant.checker"
                                      )
                                    ? "checker"
                                    : "output-only";

                            setValue("evaluation_variant", result);
                            setVariant(result);
                        }}
                    />
                    {variant !== "plain" && variant !== "output-only" && (
                        <TitledSwitch
                            choice={[
                                t(
                                    "contests.management.individual.problems.individual.info.evaluationVariant.checkers.standard"
                                ),
                                t(
                                    "contests.management.individual.problems.individual.info.evaluationVariant.checkers.interactive"
                                ),
                            ]}
                            defaultIndex={variant === "checker" ? 0 : 1}
                            onChange={(value) => {
                                console.log("HERE");
                                console.log(variant);
                                setValue(
                                    "evaluation_variant",
                                    value ===
                                        t(
                                            "contests.management.individual.problems.individual.info.evaluationVariant.checkers.standard"
                                        )
                                        ? "checker"
                                        : "interactive"
                                );
                                setVariant(
                                    value ===
                                        t(
                                            "contests.management.individual.problems.individual.info.evaluationVariant.checkers.standard"
                                        )
                                        ? "checker"
                                        : "interactive"
                                );
                            }}
                        />
                    )}
                </EditableDisplayBox>
                {problem.evaluation_variant !== "plain" && (
                    <EditableDisplayBox
                        title={t(
                            "contests.management.individual.problems.individual.info.evaluationScriptLanguage"
                        )}
                        value={problem.evaluation_language}
                        submitFunction={submitForm}
                    >
                        <select
                            name={"evaluation_language"}
                            defaultValue={problem.evaluation_language}
                            onChange={(event) => {
                                setValue("evaluation_language", event.target.value);
                            }}
                        >
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="java">Java</option>
                            <option value="esl">ESL</option>
                        </select>
                    </EditableDisplayBox>
                )}
                {problem.evaluation_variant !== "plain" && (
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
                )}

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
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="java">Java</option>
                        <option value="esl">ESL</option>
                        <option value="output-only">Output only</option>
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
                    title={t("contests.management.individual.problems.individual.info.tags")}
                    value={
                        <div tw={"flex gap-1 flex-wrap"}>
                            {problem.tags.map((tag) => (
                                <Breadcrumb key={tag} color={textToHexColor(tag)}>
                                    {tag}
                                    <FiX
                                        tw={"hover:text-red-600 cursor-pointer"}
                                        onClick={() => {
                                            setValue(
                                                "tags",
                                                problem.tags.filter((it) => it !== tag)
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
