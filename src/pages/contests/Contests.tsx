import { FC, useEffect, useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/axios";
import PageTitle from "../../components/PageTitle";
import { ContestType } from "../../types/ContestType";
import { ContestListItem } from "./ContestListItem";

export type Snowflake = bigint;

export const TableHeadItem = styled.td`
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    ${tw`text-lg font-mono text-neutral-900`}
`;

export const Contests: FC = () => {
    const [contests, setContests] = useState<ContestType[]>([]);

    useEffect(() => {
        wrapAxios<ContestType[]>(http.get("/contest"))
            .then((c) => {
                setContests(
                    c
                        .map((index) => {
                            return {
                                ...index,
                                start_time: new Date(index.start_time),
                            };
                        })
                        .sort((a, b) => {
                            const firstDone =
                                a.start_time.getTime() +
                                    a.duration_seconds * 1000 >=
                                Date.now();
                            const secondDone =
                                b.start_time.getTime() +
                                    b.duration_seconds * 1000 >=
                                Date.now();

                            if (firstDone != secondDone) {
                                return firstDone ? -1 : 1;
                            }

                            if (
                                a.start_time.getTime() == b.start_time.getTime()
                            )
                                return 0;

                            return a.start_time.getTime() >
                                b.start_time.getTime()
                                ? 1
                                : -1;
                        })
                );
            })
            .catch((error) => console.log(error.response));
    }, []);

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Contests:</PageTitle>
            <table
                tw={
                    "table-fixed bg-neutral-100 border-collapse border-solid border-neutral-200 border-2 text-left"
                }
            >
                <tr tw={"border-[1px] border-neutral-400 border-solid"}>
                    <TableHeadItem>Name</TableHeadItem>
                    <TableHeadItem>Start time</TableHeadItem>
                    <TableHeadItem>Starts</TableHeadItem>
                    <TableHeadItem>Duration</TableHeadItem>
                </tr>
                {contests.map((c) => (
                    <ContestListItem contest={c} key={c.id + ""} />
                ))}
            </table>
        </div>
    );
};
