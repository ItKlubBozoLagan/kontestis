import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";

export const ContestProblemsPage: FC = () => {
    const { contest } = useContestContext();

    return <div>Problems {contest.name}</div>;
};
