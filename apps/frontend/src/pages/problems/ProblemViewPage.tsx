import "./problem-markdown.scss";

import { EvaluationLanguage } from "@kontestis/models";
import React, { FC, useEffect, useRef, useState } from "react";
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
import { useDocumentEvent } from "../../hooks/useDocumentEvent";
import { useTranslation } from "../../hooks/useTranslation";
import { convertToBase64 } from "../../util/base";
import { SubmissionListTable } from "../submissions/SubmissionListTable";

const TAB_CHAR = "    ";

type Properties = {
    problemId: string;
};

type LimitBoxProperties = {
    icon: IconType;
    title: string;
    value: string;
};

export const LimitBox = React.forwardRef<
    HTMLDivElement,
    LimitBoxProperties & React.HTMLAttributes<HTMLDivElement>
>(({ icon: Icon, title, value, ...properties }, reference) => {
    return (
        <div
            tw={
                "w-full bg-neutral-100 border-2 border-solid border-neutral-200 p-4 flex justify-between gap-4"
            }
            ref={reference}
            {...properties}
        >
            <div tw={"flex items-center gap-4 text-lg"}>
                <Icon size={"18px"} />
                {title}
            </div>
            <span tw={"text-lg"}>{value}</span>
        </div>
    );
});

LimitBox.displayName = "LimitBox";

export const ProblemViewPage: FC = () => {
    const { problemId } = useParams<Properties>();

    const textAreaReference = useRef<HTMLTextAreaElement | null>(null);

    const [language, setLanguage] = useState<EvaluationLanguage>("python");

    const [code, setCode] = useState("");

    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    const { data: submissions } = useAllProblemSubmissions(BigInt(problemId ?? 0), {
        refetchInterval: 1000,
    });

    const { t } = useTranslation();

    useEffect(() => {
        const textArea = textAreaReference.current;

        if (textArea) textArea.value = code;
    }, [code]);

    useDocumentEvent("keydown", (event) => {
        const textArea = textAreaReference.current;
        const { target } = event;

        if (!textArea || !target || !(target instanceof Node)) return;

        const targetNode = event.target as Node;

        if (!textArea.isEqualNode(targetNode)) return;

        if (event.key !== "Tab") return;

        event.preventDefault();

        if (!textArea.selectionStart && textArea.selectionStart != 0) {
            textArea.value += TAB_CHAR;
            textArea.focus();
        } else {
            const startPos = textArea.selectionStart;
            const endPos = textArea.selectionEnd;
            const { scrollTop } = textArea;

            textArea.value =
                textArea.value.slice(0, Math.max(0, startPos)) +
                TAB_CHAR +
                textArea.value.slice(endPos, textArea.value.length);

            textArea.focus();
            textArea.selectionStart = startPos + TAB_CHAR.length;
            textArea.selectionEnd = startPos + TAB_CHAR.length;
            textArea.scrollTop = scrollTop;
        }
    });

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6"}>
            <span tw={"text-neutral-800 text-3xl"}>{problem?.title}</span>
            <div tw={"flex flex-col gap-4 w-full"}>
                <div tw={"w-full flex gap-4"}>
                    <TitledSection title={t("problems.individual.limits.title")}>
                        <div tw={"flex flex-col items-center justify-between gap-4 w-full h-full"}>
                            <LimitBox
                                icon={FiClock}
                                title={t("problems.individual.limits.time")}
                                value={(problem?.time_limit_millis ?? 0) + " ms"}
                            />
                            <LimitBox
                                icon={FiDatabase}
                                title={t("problems.individual.limits.memory")}
                                value={(problem?.memory_limit_megabytes ?? 0) + " MiB"}
                            />
                            <LimitBox
                                icon={FiCode}
                                title={t("problems.individual.limits.sourceSize")}
                                value={"64 KiB"}
                            />
                            <LimitBox
                                icon={FiCheckSquare}
                                title={t("problems.individual.limits.points")}
                                value={(problem?.score ?? 0).toString()}
                            />
                        </div>
                    </TitledSection>
                    <TitledSection title={t("problems.individual.submit.title")}>
                        <span tw={"text-lg w-full text-left"}>
                            {t("problems.individual.submit.code")}
                        </span>
                        <textarea
                            tw={"w-full h-48 resize-none font-mono text-sm"}
                            style={{ tabSize: 4 }}
                            onChange={(event) => setCode(event.target.value)}
                            ref={textAreaReference}
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

                                // TODO: react query mutations
                                const _ = http.post("/submission/" + problemId + "/", {
                                    code: convertToBase64(code),
                                    language,
                                });

                                setCode("");
                            }}
                        >
                            {t("problems.individual.submit.submitButton")}
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
                    {problem ? problem.description : t("problems.individual.loading")}
                </ReactMarkdown>
            </div>
        </div>
    );
};
