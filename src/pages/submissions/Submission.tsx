import { FC, useEffect, useState } from "react";
import { useParams } from "react-router";

import { http, wrapAxios } from "../../api/http";
import { TitledSection } from "../../components/TitledSection";
import { SubmissionType } from "../../types/SubmissionType";

type Properties = {
    submission_id: string;
};

export const Submission: FC = () => {
    const { submission_id } = useParams<Properties>();

    const [submission, setSubmission] = useState<SubmissionType>({
        id: BigInt(0),
        user_id: BigInt(0),
        problem_id: BigInt(0),
        code: "Loading",
        language: "python",
        completed: false,
    });

    const [clusters, setClusters] = useState();

    useEffect(() => {
        wrapAxios<SubmissionType>(
            http.get("/submission/submission/" + submission_id + "/")
        ).then(setSubmission);
    }, []);

    return (
        <div tw={"w-full h-full py-12 flex flex-col"}>
            <TitledSection title={"Code"} tw={"h-full"}>
                <textarea
                    value={atob(submission.code)}
                    tw={"w-full h-[500px]"}
                ></textarea>
            </TitledSection>
        </div>
    );
};
