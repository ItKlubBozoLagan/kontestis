import { zodResolver } from "@hookform/resolvers/zod";
import { ExamFinalSubmission } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { Translated } from "../../../../components/Translated";
import { useModifyFinalSubmission } from "../../../../hooks/submission/final/useModifyFinalSubmission";
import { useTranslation } from "../../../../hooks/useTranslation";

type Parameters = {
    finalSubmission: ExamFinalSubmission;
};

const ModifyFinalSubmissionSchema = z.object({
    reviewed: z.boolean(),
    final_score: z.coerce.number(),
});

export const FinalSubmissionInfoSection: FC<Parameters> = ({ finalSubmission }) => {
    const {
        setValue,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyFinalSubmissionSchema>>({
        resolver: zodResolver(ModifyFinalSubmissionSchema),
        defaultValues: {
            reviewed: finalSubmission.reviewed,
            final_score: finalSubmission.final_score,
        },
    });

    const modifyMutation = useModifyFinalSubmission(finalSubmission.id);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    });

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} ref={formReference} tw={"flex flex-col gap-4"}>
            <EditableDisplayBox
                title={"Final Score"}
                value={finalSubmission.final_score}
                submitFunction={submitForm}
            >
                <TitledInput {...register("final_score")} />
            </EditableDisplayBox>
            {finalSubmission.reviewed ? (
                <SimpleButton
                    tw={"bg-red-100"}
                    type={"button"}
                    onClick={() => {
                        setValue("reviewed", false);
                        submitForm();
                    }}
                >
                    Set Unreviewed
                </SimpleButton>
            ) : (
                <SimpleButton
                    tw={"bg-green-100"}
                    onClick={() => {
                        setValue("reviewed", true);
                        submitForm();
                    }}
                >
                    Set reviewed
                </SimpleButton>
            )}
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
