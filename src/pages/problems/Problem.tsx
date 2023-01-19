import { FC, useEffect, useState } from "react";
import { useParams } from "react-router";

import { http, wrapAxios } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledSection } from "../../components/TitledSection";
import { ProblemType } from "../../types/ProblemType";

type Properties = {
    problem_id: string;
};

export const Problem: FC = () => {
    const { problem_id } = useParams<Properties>();

    const [problem, setProblem] = useState<ProblemType>({
        id: BigInt(0),
        contest_id: BigInt(0),
        title: "Loading",
        description: "Loading",
        time_limit_millis: 0,
        memory_limit_megabytes: 0,
    });

    useEffect(() => {
        wrapAxios<ProblemType>(http.get("/problem/" + problem_id + "/")).then(
            setProblem
        );
    }, []);

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-4"}>
            <div tw={"text-neutral-800 text-3xl"}>{problem.title}</div>
            <div tw={"text-neutral-700 text-lg"}>{problem.description}</div>
            <div tw={"w-full flex justify-between gap-5"}>
                <TitledSection title={"Limits"}>
                    <div>Time: {problem.time_limit_millis}MS</div>
                    <div>Memory: {problem.memory_limit_megabytes}MB</div>
                    <div>Source size: 64KB</div>
                </TitledSection>
                <TitledSection title={"Submit"}>
                    <div>Submit code:</div>
                    <textarea tw={"w-4/5"} />
                    <SimpleButton>Submit</SimpleButton>
                    <div>Language: CPP</div>
                </TitledSection>
            </div>
            <TitledSection title={"Submissions"}>
                Your submissions will show up here
            </TitledSection>
        </div>
    );
};
