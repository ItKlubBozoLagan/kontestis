import "./problem-markdown.scss";

import { EvaluationLanguage } from "@kontestis/models";
import { FC, useState } from "react";
import { IconType } from "react-icons";
import { FiCheckSquare, FiClock, FiCode, FiDatabase } from "react-icons/all";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { theme } from "twin.macro";

import { http } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledSection } from "../../components/TitledSection";
import { useProblem } from "../../hooks/problem/useProblem";
import { useAllProblemSubmissions } from "../../hooks/submission/useAllProblemSubmissions";
import { useInterval } from "../../hooks/useInterval";
import { convertToBase64 } from "../../util/base";
import { SubmissionListTable } from "../submissions/SubmissionListTable";

type Properties = {
    problemId: string;
};

type LimitBoxProperties = {
    icon: IconType;
    title: string;
    value: string;
};

export const LimitBox: FC<LimitBoxProperties> = ({ icon: Icon, title, value, ...properties }) => {
    return (
        <div
            tw={
                "w-full bg-neutral-100 border-2 border-solid border-neutral-200 p-4 flex justify-between gap-4"
            }
            {...properties}
        >
            <div tw={"flex items-center gap-4 text-lg"}>
                <Icon size={"18px"} />
                {title}
            </div>
            <span tw={"text-lg"}>{value}</span>
        </div>
    );
};

export const ProblemViewPage: FC = () => {
    const { problemId } = useParams<Properties>();

    const [language, setLanguage] = useState<EvaluationLanguage>("python");

    const [code, setCode] = useState("");

    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    const { data: submissions, refetch } = useAllProblemSubmissions(BigInt(problemId ?? 0));

    useInterval(() => {
        const _ = refetch();
    }, 1000);

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6"}>
            <span tw={"text-neutral-800 text-3xl"}>{problem?.title}</span>
            <div tw={"flex flex-col gap-4 w-full"}>
                <div tw={"w-full flex gap-4"}>
                    <TitledSection title={"Limits"}>
                        <div tw={"flex flex-col items-center justify-between gap-4 w-full h-full"}>
                            <LimitBox
                                icon={FiClock}
                                title={"Time"}
                                value={(problem?.time_limit_millis ?? 0) + " ms"}
                            />
                            <LimitBox
                                icon={FiDatabase}
                                title={"Memory"}
                                value={(problem?.memory_limit_megabytes ?? 0) + " MiB"}
                            />
                            <LimitBox icon={FiCode} title={"Source size"} value={"64 KiB"} />
                            <LimitBox
                                icon={FiCheckSquare}
                                title={"Points"}
                                value={(problem?.score ?? 0).toString()}
                            />
                        </div>
                    </TitledSection>
                    <TitledSection title={"Submit"}>
                        <span tw={"text-lg w-full text-left"}>Code:</span>
                        <textarea
                            tw={"w-full h-48 resize-none font-mono text-sm"}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <select
                            name="languages"
                            onChange={(event) =>
                                setLanguage(event.target.value as EvaluationLanguage)
                            }
                        >
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                        </select>
                        <SimpleButton
                            color={theme`colors.red.300`}
                            onClick={() => {
                                if (code.trim().length === 0) return;

                                setCode("");

                                // TODO: react query mutations
                                const _ = http.post("/submission/" + problemId + "/", {
                                    code: convertToBase64(code),
                                    language,
                                });
                            }}
                        >
                            Submit
                        </SimpleButton>
                    </TitledSection>
                </div>

                {problem && (
                    <SubmissionListTable
                        submissions={submissions}
                        problem={problem}
                        adminView={false}
                    />
                )}
            </div>
            <div
                className={"problem-markdown-container"}
                tw={
                    "p-4 bg-neutral-100 text-neutral-900 text-lg border-2 border-solid border-neutral-200 w-full"
                }
            >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {problem ? problem.description : "Loading"}
                </ReactMarkdown>
            </div>
        </div>
    );
};
