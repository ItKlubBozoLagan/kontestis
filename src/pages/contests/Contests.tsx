import {FC, useEffect, useState} from "react";
import {http, wrapAxios} from "../../api/axios";
import {ContestItem, ContestListItem} from "./ContestListItem";
import styled from "styled-components";
import tw from "twin.macro";

export type Snowflake = bigint;

export type Contest = {
    id: Snowflake,
    admin_id: Snowflake,
    name: string,
    start_time: Date,
    duration_seconds: number,
    public: boolean,
}

export const TableHeadItem = styled.td`
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  ${tw`text-lg font-mono text-neutral-900`}
`;

export const Contests: FC = () => {

    const [contests, setContests] = useState<Contest[]>([]);

    useEffect(() => {
        wrapAxios<Contest[]>(http.get('/contest')).then((c) => {
            setContests(c.map((i) => {
                return {
                  ...i,
                  start_time: new Date(i.start_time)
                };
            }).sort((a, b) => {
                const firstDone = a.start_time.getTime() + a.duration_seconds * 1000 >= Date.now();
                const secondDone = b.start_time.getTime() + b.duration_seconds * 1000 >= Date.now();
                if(firstDone != secondDone) {
                    return firstDone ? -1 : 1;
                }
                if(a.start_time.getTime() == b.start_time.getTime()) return 0;
                return a.start_time.getTime() > b.start_time.getTime() ? 1 : -1;
            }));
        }).catch(reason => console.log(reason.response));
    }, []);

    return <div tw={"w-full flex flex-col"}>
        <div tw={"w-full flex flex-col py-10 text-neutral-700"}>
            <div tw={"text-4xl"}>Contests: </div>
            <div tw={"w-full h-2 border-solid border-2 border-t-0 border-r-0 border-l-0 border-neutral-500"}> </div>
        </div>
        <table tw={"table-fixed bg-neutral-100 border-collapse border-solid border-neutral-200 border-2 text-left"}>
            <tr tw={"border-[1px] border-neutral-400 border-solid"}>
                <TableHeadItem>Name</TableHeadItem>
                <TableHeadItem>Start time</TableHeadItem>
                <TableHeadItem>Starts</TableHeadItem>
                <TableHeadItem>Duration</TableHeadItem>
            </tr>
            {contests.map(c => <ContestListItem contest={c} key={c.id + ""}/>)}

        </table>
    </div>
}