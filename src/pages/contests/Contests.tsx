import { FC, useEffect, useState } from "react";

import { http, wrapAxios } from "../../api/http";
import PageTitle from "../../components/PageTitle";
import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { ContestType } from "../../types/ContestType";
import { ContestListItem } from "./ContestListItem";

export type Snowflake = bigint;

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
            <Table>
                <TableHeadRow>
                    <TableHeadItem>Name</TableHeadItem>
                    <TableHeadItem>Start time</TableHeadItem>
                    <TableHeadItem>Starts</TableHeadItem>
                    <TableHeadItem>Duration</TableHeadItem>
                </TableHeadRow>
                {contests.map((c) => (
                    <ContestListItem contest={c} key={c.id + ""} />
                ))}
            </Table>
        </div>
    );
};
