import { FC, useEffect, useState } from "react";

import { http, wrapAxios } from "../../api/axios";
import { TitledSection } from "../../components/TitledSection";
import { Snowflake } from "../contests/Contests";

type Properties = {
    problem_id: Snowflake;
};

type ProblemType = {
    id: Snowflake;
    contest_id: Snowflake;
    title: string;
    description: string;

    time_limit_millis: number;
    memory_limit_megabytes: number;
};

export const Problem: FC<Properties> = ({ problem_id }) => {
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
        <div tw={"w-full flex flex-col justify-start items-center gap-4 mt-5"}>
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
                    <input tw={"w-1/2"} />
                    <div>Language: CPP</div>
                </TitledSection>
            </div>
            <TitledSection title={"Submissions"}>
                Your submissions will show up here
            </TitledSection>
        </div>
    );
};
