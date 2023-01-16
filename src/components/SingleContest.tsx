import {Contest} from "../pages/Contests";
import {FC} from "react";
import styled from "styled-components";

type Props = {
    contest: Contest
}

const ContestRow = styled.tr`
    
`;

const ContestItem = styled.td`

`;

export const SingleContest: FC<Props> = ( { contest }) => {
    return (
        <ContestRow>
            <ContestItem>{contest.name}</ContestItem>
            <ContestItem>{new Date(contest.start_time).getTime()}</ContestItem>
            <ContestItem>{contest.duration_seconds}</ContestItem>
        </ContestRow>
    );
}