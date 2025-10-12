import { Testcase } from "@kontestis/models";
import { FC } from "react";
import { FiCheck, FiLayers, FiX } from "react-icons/all";

import { LimitBox } from "../../../../../problems/ProblemViewPage";

type Properties = {
    testcase: Testcase;
};

export const TestcaseStatusSection: FC<Properties> = ({ testcase }) => {
    return (
        <div tw={"w-full self-center flex flex-col gap-2"}>
            {testcase.status === "ready" ? (
                <LimitBox
                    title="Testcase Status"
                    value="Ready"
                    icon={FiCheck}
                    tw={"bg-green-100"}
                />
            ) : testcase.status === "generator-error" ? (
                <LimitBox
                    title="Testcase Status"
                    value="Generator Error"
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : testcase.status === "solution-error" ? (
                <LimitBox
                    title="Testcase Status"
                    value="Solution Error"
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : testcase.status === "validation-error" ? (
                <LimitBox
                    title="Testcase Status"
                    value="Validation Error"
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : (
                <LimitBox
                    icon={FiLayers}
                    title="Testcase Status"
                    value="Not Ready"
                    tw={"bg-blue-100"}
                />
            )}
            {testcase.error && (
                <div tw={"w-full p-3 bg-red-100 border border-red-300 rounded text-sm"}>
                    <div tw={"font-bold text-red-700"}>Error:</div>
                    <div tw={"text-red-600 mt-1 font-mono whitespace-pre-wrap"}>
                        {testcase.error}
                    </div>
                </div>
            )}
        </div>
    );
};
