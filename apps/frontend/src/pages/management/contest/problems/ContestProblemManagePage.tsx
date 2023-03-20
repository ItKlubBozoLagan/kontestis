import { FC } from "react";
import { FiCheckSquare } from "react-icons/all";
import { useParams } from "react-router";

import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { LimitBox } from "../../../problems/ProblemViewPage";

type Properties = {
    problemId: string;
};

export const ContestProblemManagePage: FC = () => {
    const { problemId } = useParams<Properties>();

    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    return (
        <div tw={"w-full flex flex-col"}>
            <div tw={"w-3/5 self-center"}>
                <TitledSection title={"Info"}>
                    <EditableDisplayBox
                        title={"Name"}
                        value={problem?.title ?? "Loading"}
                        submitFunction={() => {}}
                    >
                        <TitledInput />
                    </EditableDisplayBox>
                    <EditableDisplayBox
                        title={"Description"}
                        value={problem?.description ?? "Loading"}
                        submitFunction={() => {}}
                        textValue
                    >
                        <textarea />
                    </EditableDisplayBox>
                    <LimitBox
                        icon={FiCheckSquare}
                        title={"Score"}
                        value={(problem?.score ?? 0) + ""}
                    />
                </TitledSection>
            </div>
        </div>
    );
};
