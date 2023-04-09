import { FC } from "react";
import { useParams } from "react-router";

import { PageTitle } from "../../../../components/PageTitle";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { useFinalSubmission } from "../../../../hooks/submission/final/useFinalSubmission";
import { useSubmission } from "../../../../hooks/submission/useSubmission";
import { convertFromBase64 } from "../../../../util/base";

type Parameters = {
    final_submission_id: string;
};

export const FinalSubmissionReviewPage: FC = () => {
    const { final_submission_id } = useParams<Parameters>();

    const { data: finalSubmission } = useFinalSubmission(BigInt(final_submission_id ?? 0));
    const { data: submission } = useSubmission(BigInt(finalSubmission?.id ?? 0), {
        enabled: !!finalSubmission,
    });
    const { data: problem } = useProblem(BigInt(submission?.id ?? 0), {
        enabled: !!submission,
    });

    return (
        <div tw={"w-full flex flex-col gap-2"}>
            <PageTitle>Review Submission</PageTitle>
            <span>Problem: {problem?.title ?? "Loading"}</span>
            <pre>
                <code
                    className={`line-numbers match-braces rainbow-braces language-${
                        submission?.language ?? "python"
                    }`}
                >
                    {convertFromBase64(submission?.code ?? "")}
                </code>
            </pre>
        </div>
    );
};
