import { zodResolver } from "@hookform/resolvers/zod";
import { Snowflake, Testcase } from "@kontestis/models";
import { cutText } from "@kontestis/utils";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../../components/EditableDisplayBox";
import { TitledSection } from "../../../../../../components/TitledSection";
import { Translated } from "../../../../../../components/Translated";
import { useModifyTestcase } from "../../../../../../hooks/problem/cluster/testcase/useCreateTestcase";
import { useTranslation } from "../../../../../../hooks/useTranslation";

type Properties = {
    problemId: Snowflake;
    testcase: Testcase;
};

const ModifyTestcaseSchema = z.object({
    input: z.string().min(1),
    correctOutput: z.string().min(1),
});

export const TestcaseInfoSection: FC<Properties> = ({ problemId, testcase }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyTestcaseSchema>>({
        resolver: zodResolver(ModifyTestcaseSchema),
        defaultValues: {
            input: testcase.input,
            correctOutput: testcase.correct_output,
        },
    });

    const modifyMutation = useModifyTestcase([problemId, testcase.cluster_id, testcase.id]);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        queryClient.invalidateQueries(["testcases", problemId, testcase.cluster_id]);
        queryClient.invalidateQueries([
            "problem",
            problemId,
            "cluster",
            testcase.cluster_id,
            "testcase",
            testcase.id,
        ]);
        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} ref={formReference}>
            <TitledSection
                title={t("contests.management.individual.problems.cluster.testCase.info")}
            >
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.cluster.testCase.input")}
                    value={cutText(testcase.input, 100)}
                    submitFunction={submitForm}
                    largeTextValue
                >
                    <textarea {...register("input")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.cluster.testCase.output")}
                    value={cutText(testcase.correct_output ?? "", 100)}
                    submitFunction={submitForm}
                    largeTextValue
                >
                    <textarea {...register("correctOutput")} />
                </EditableDisplayBox>
            </TitledSection>
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
        </form>
    );
};
