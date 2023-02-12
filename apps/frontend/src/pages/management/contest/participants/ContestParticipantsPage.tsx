import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";

export const ContestParticipantsPage: FC = () => {
    const contest = useContestContext();

    return <div>Participants {contest.name}</div>;
};
