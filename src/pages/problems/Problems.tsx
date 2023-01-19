import React, { FC, useEffect, useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/http";
import { PageTitle } from "../../components/PageTitle";
import { ProblemType } from "../../types/ProblemType";
import { ProblemListItem } from "./ProblemListItem";

export type Snowflake = bigint;

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

export const Problems: FC = () => {
    const [problems, setProblems] = useState<ProblemType[]>([]);

    useEffect(() => {
        wrapAxios<Contest[]>(http.get("/contest")).then((c) => {
            c.map((contestIndex) =>
                wrapAxios<ProblemType[]>(
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
