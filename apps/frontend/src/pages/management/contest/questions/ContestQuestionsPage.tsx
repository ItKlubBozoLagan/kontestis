import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";

export const ContestQuestionsPage: FC = () => {
    const { contest } = useContestContext();

    return <div>Messages {contest.name}</div>;
};
