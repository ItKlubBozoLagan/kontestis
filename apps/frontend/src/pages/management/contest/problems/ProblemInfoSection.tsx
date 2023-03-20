import { zodResolver } from "@hookform/resolvers/zod";
import { ProblemWithScore } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiCheckSquare } from "react-icons/all";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { useContestContext } from "../../../../context/constestContext";
import { useModifyProblem } from "../../../../hooks/problem/useCreateProblem";
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
});

export const ProblemInfoSection: FC<Properties> = ({ problem }) => {
    const { contest } = useContestContext();

    const {
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

    return (
        <form tw={"w-full"} onSubmit={onSubmit} ref={formReference}>
            <TitledSection title={"Info"}>
                <EditableDisplayBox
                    title={"Name"}
                    value={problem?.title ?? "Loading"}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("title")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={"Description"}
                    value={problem?.description ?? "Loading"}
                    submitFunction={submitForm}
                    textValue
                >
                    <textarea {...register("description")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={"Time Limit (ms)"}
                    value={(problem?.time_limit_millis ?? 0) + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("time_limit_millis")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={"Memory Limit (MiB)"}
                    value={(problem?.memory_limit_megabytes ?? 0) + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("memory_limit_megabytes")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={"Evaluation Script (Python)"}
                    value={problem?.evaluation_script ?? "None"}
                    submitFunction={submitForm}
                    textValue
                >
                    <textarea {...register("evaluation_script")} />
                </EditableDisplayBox>
                <LimitBox icon={FiCheckSquare} title={"Score"} value={(problem?.score ?? 0) + ""} />
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && (
                        <span>Validation error! Check your input!</span>
                    )}
                    {modifyMutation.error && <span>Error! {modifyMutation.error.message}</span>}
                </div>
            </TitledSection>
        </form>
    );
};
