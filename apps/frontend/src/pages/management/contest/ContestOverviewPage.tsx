import { FC } from "react";

import { useContestContext } from "../../../context/constestContext";

export const ContestOverviewPage: FC = () => {
    const { contest } = useContestContext();

    return <div>Overview {contest.name}</div>;
};
