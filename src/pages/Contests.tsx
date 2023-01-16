import {FC, useEffect, useState} from "react";
import {http, wrapAxios} from "../api/axios";
import {SingleContest} from "../components/SingleContest";
import styled from "styled-components";
import tw from "twin.macro";

export type Snowflake = bigint;

export type Contest = {
    id: Snowflake,
    admin_id: Snowflake,
    name: string,
    start_time: string,
    duration_seconds: number,
    public: boolean,
}

const TableHead = styled.th`
    padding: 12px;
    ${tw`bg-neutral-200`};
`;

export const Contests: FC = () => {

    const [contests, setContests] = useState<Contest[]>([]);

    useEffect(() => {
        wrapAxios<Contest[]>(http.get('/contest')).then(setContests).catch(reason => console.log(reason.response));
    }, []);


    return <div tw={"w-full flex flex-col gap-2"}>
        <div>Contests: </div>
        <table>
            <tr>
                <TableHead>Name</TableHead>
                <th>Start time</th>
                <th>Duration</th>
            </tr>
            {contests.map(c => <SingleContest contest={c} key={c.id + ""}/>)}

        </table>
    </div>
}