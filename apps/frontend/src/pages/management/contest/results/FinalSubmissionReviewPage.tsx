import Prism from "prismjs";
import { FC, useEffect } from "react";
import { FiCopy } from "react-icons/all";
import { useParams } from "react-router";

import { PageTitle } from "../../../../components/PageTitle";
import { TitledSection } from "../../../../components/TitledSection";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { useFinalSubmission } from "../../../../hooks/submission/final/useFinalSubmission";
import { useSubmission } from "../../../../hooks/submission/useSubmission";
import { convertFromBase64 } from "../../../../util/base";
import { FinalSubmissionInfoSection } from "./FinalSubmissionInfoSection";

type Parameters = {
    final_submission_id: string;
};

Prism.manual = true;

export const FinalSubmissionReviewPage: FC = () => {
    const { final_submission_id } = useParams<Parameters>();

    const { data: finalSubmission } = useFinalSubmission(BigInt(final_submission_id ?? 0));
    const { data: submission } = useSubmission(BigInt(finalSubmission?.submission_id ?? 0), {
        enabled: !!finalSubmission,
    });
    const { data: problem } = useProblem(BigInt(submission?.problem_id ?? 0), {
        enabled: !!submission,
    });

    useEffect(() => {
        Prism.highlightAll();
    }, [submission]);

    return (
        <div tw={"w-full flex flex-col gap-5"}>
            <PageTitle>Review Submission</PageTitle>
            <span tw={"text-2xl"}>{problem?.title ?? "Loading"}</span>
            <TitledSection title={"Code"}>
                {
                    <div tw={"relative w-full"}>
                        <pre>
                            <code
                                className={`line-numbers match-braces rainbow-braces language-${
                                    submission?.language ?? "python"
                                }`}
                            >
                                {convertFromBase64(submission?.code ?? "")}
                            </code>
                        </pre>
                        <div
                            tw={"absolute top-4 right-2 p-2"}
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    convertFromBase64(submission?.code ?? "")
                                )
                            }
                        >
                            <FiCopy tw={"cursor-pointer hover:opacity-75"} size={"24px"} />
                        </div>
                    </div>
                }
            </TitledSection>
            {finalSubmission && <FinalSubmissionInfoSection finalSubmission={finalSubmission} />}
        </div>
    );
};
