import {Contest} from "../pages/Contests";
import {FC, useEffect, useState} from "react";
import styled from "styled-components";
import tw from "twin.macro";

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

const parseTime = (timeInMillis: number) => {
    let timeLeft = Math.floor(timeInMillis / 1000);
    let timeString = "";

    const days = Math.floor(timeLeft / (3600 * 24));
    timeLeft -= days * 3600 * 24;
    if(days) {
        timeString += days + "d ";
    }
    const hours = Math.floor(timeLeft / 3600);
    timeLeft -= hours * 3600;
    if(hours) {
        timeString += hours + "h ";
    }
    const minutes = Math.floor(timeLeft / 60);
    timeLeft -= minutes * 60;
    if(minutes) {
        timeString += minutes + "m ";
    }
    if(timeLeft) {
        timeString += timeLeft + "s";
    }
    return timeString;
}

export const SingleContest: FC<Props> = ( { contest }) => {

    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <ContestRow>
            <ContestItem tw={"hover:(text-sky-800 cursor-pointer)"}>{contest.name}</ContestItem>
            <ContestItem>{contest.start_time.toLocaleString()}</ContestItem>
            <ContestItem>
                {contest.start_time.getTime() > time ?
                    parseTime(contest.start_time.getTime() - time)
                        :
                    contest.start_time.getTime() + contest.duration_seconds * 1000 > time ?
                        <div tw={"text-green-700"}>Started</div>
                        :
                        <div tw={"text-red-600"}>Finished</div>}
            </ContestItem>
            <ContestItem>{parseTime(contest.duration_seconds * 1000)}</ContestItem>
        </ContestRow>
    );
}