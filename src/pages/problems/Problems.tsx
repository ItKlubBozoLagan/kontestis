import React, { FC, useEffect, useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/axios";
import PageTitle from "../../components/PageTitle";
import { ProblemListItem } from "./ProblemListItem";

export type Snowflake = bigint;

type EvaluationVariant = "plain" | "script" | "interactive";

type Problem = {
    id: Snowflake;
    contest_id: Snowflake;
    title: string;
    description: string;

    evaluation_variant: EvaluationVariant;
    evaluation_script?: string;

    time_limit_millis: number;
    memory_limit_megabytes: number;
};

export type Contest = {
    id: Snowflake;
    admin_id: Snowflake;
    name: string;
    start_time: Date;
    duration_seconds: number;
    public: boolean;
};

const TableHead = styled.th`
    ${tw`text-lg font-mono text-neutral-900 py-2 pl-2`}
`;

const Problems: FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);

    useEffect(() => {
        wrapAxios<Contest[]>(http.get("/contest")).then((c) => {
            c.map((contestIndex) =>
                wrapAxios<Problem[]>(
                    http.get("/problem", {
                        params: { contest_id: contestIndex.id },
                    })
                ).then((p) => {
                    setProblems([...problems, ...p]);
                })
            );
        });
    }, []);

    return (
        <div>
            <PageTitle>Problems:</PageTitle>
            <table>
                <tr tw="border-[1px] border-neutral-400 border-solid">
                    <TableHead>Name</TableHead>
                    <TableHead>Contest Name</TableHead>
                    <TableHead>Variant</TableHead>
                </tr>
                {problems.map((p) => (
                    <ProblemListItem key={p.id + ""}></ProblemListItem>
                ))}
            </table>
        </div>
    );
};

export default Problems;
