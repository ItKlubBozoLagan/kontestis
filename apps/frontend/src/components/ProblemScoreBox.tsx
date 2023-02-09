import { FC } from "react";
import styled from "styled-components";
import { theme } from "twin.macro";

const colors = {
    none: theme`colors.red.700`,
    low: theme`colors.red.600`,
    mediumLow: theme`colors.orange.700`,
    mediumHigh: theme`colors.yellow.600`,
    high: theme`colors.lime.600`,
    full: theme`colors.green.800`,
};

type Properties = {
    score: number;
    maxScore: number;
};

const ScoreDiv = styled.div<{ $color: string }>`
    color: ${({ $color }) => $color};
`;

export const ProblemScoreBox: FC<Properties> = ({ score, maxScore }) => {
    const percent = score / maxScore;

    let color = "";

    if (percent === 0) {
        color = colors.none;
    } else if (percent <= 0.25) {
        color = colors.low;
    } else if (percent <= 0.5) {
        color = colors.mediumLow;
    } else if (percent <= 0.75) {
        color = colors.mediumHigh;
    } else if (percent < 1) {
        color = colors.high;
    } else {
        color = colors.full;
    }

    return (
        <ScoreDiv $color={color} tw={"border-solid border-2 border-neutral-100 rounded-md"}>
            {score}/{maxScore}
        </ScoreDiv>
    );
};
