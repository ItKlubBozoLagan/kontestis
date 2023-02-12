import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";

export const ContestAlertsPage: FC = () => {
    const contest = useContestContext();

    return <div>Alerts {contest.name}</div>;
};
