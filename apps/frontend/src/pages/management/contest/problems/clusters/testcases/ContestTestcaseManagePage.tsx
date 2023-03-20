import { FC } from "react";
import { useParams } from "react-router";

import { useTestcase } from "../../../../../../hooks/problem/cluster/testcase/useTestcase";
import { TestcaseInfoSection } from "./TestcaseInfoSection";

type Properties = {
    problemId: string;
    clusterId: string;
    testcaseId: string;
};

export const ContestTestcaseManagePage: FC = () => {
    const { problemId, clusterId, testcaseId } = useParams<Properties>();

    const { data: testcase } = useTestcase([
        BigInt(problemId ?? 0),
        BigInt(clusterId ?? 0),
        BigInt(testcaseId ?? 0),
    ]);

    return (
        <div tw={"w-full flex flex-col gap-6 items-end"}>
            <div tw={"w-3/5 self-center"}>
                {" "}
                {testcase && (
                    <TestcaseInfoSection problemId={BigInt(problemId ?? 0)} testcase={testcase} />
                )}
            </div>
        </div>
    );
};
