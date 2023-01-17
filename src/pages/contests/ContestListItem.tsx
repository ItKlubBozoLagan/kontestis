import {Contest} from "./Contests";
import {FC, useEffect, useState} from "react";
import styled from "styled-components";
import tw from "twin.macro";
import {parseTime} from "../../utils/utils";

type Props = {
    contest: Contest
}

const ContestRow = styled.tr`
    border-bottom: 1px solid;
    ${tw`border-neutral-300`};
`;

export const ContestItem = styled.td`
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
  ${tw`text-sm font-mono text-neutral-700`}
`;

export const ContestListItem: FC<Props> = ({ contest }) => {

    const [time, setTime] = useState(Date.now());
    const [state, setState] = useState<"pending" | "started" | "finished">("pending");

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        if(Date.now() < contest.start_time.getTime()) setState("pending");
        if(Date.now() > contest.start_time.getTime()) setState("started");
        if(Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000) setState("finished");

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <ContestRow>
            <ContestItem tw={"hover:(text-sky-800 cursor-pointer)"}>{contest.name}</ContestItem>
            <ContestItem>{contest.start_time.toLocaleString()}</ContestItem>
            <ContestItem>
                {state == "pending" ?
                    parseTime(contest.start_time.getTime() - time)
                        :
                    state == "started" ?
                        <div tw={"text-green-700"}>Started</div>
                        :
                        <div tw={"text-red-600"}>Finished</div>}
            </ContestItem>
            <ContestItem>{parseTime(contest.duration_seconds * 1000)}</ContestItem>
        </ContestRow>
    );
}