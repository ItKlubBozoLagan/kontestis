import { FC, useEffect, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/all";
import { useParams } from "react-router";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { ProblemType } from "../../types/ProblemType";
import { SubmissionType } from "../../types/SubmissionType";

type Properties = {
    problem_id: string;
};

export const Problem: FC = () => {
    const { problem_id } = useParams<Properties>();

    const [problem, setProblem] = useState<ProblemType>({
        id: BigInt(0),
        contest_id: BigInt(0),
        title: "Loading",
        description: "Loading",
        time_limit_millis: 0,
        memory_limit_megabytes: 0,
    });

    const [submissions, setSubmission] = useState<SubmissionType[]>([]);

    const [expanded, setExpanded] = useState(false);

    const [code, setCode] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            wrapAxios<SubmissionType[]>(
                http.get("/submission/" + problem_id + "/")
            ).then((d) => {
                setSubmission(d);
            });
        }, 1000);

        wrapAxios<ProblemType>(http.get("/problem/" + problem_id + "/")).then(
            setProblem
        );

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 py-10"}>
            <span tw={"text-neutral-800 text-3xl"}>{problem.title}</span>
            <span tw={"text-xl"}>
                {`${submissions.length} submissions so far`}
            </span>
            <div tw={"flex flex-col gap-4"}>
                <div tw={"w-full flex justify-between gap-4"}>
                    <TitledSection title={"Limits"}>
                        <span>Time: {problem.time_limit_millis}ms</span>
                        <span>
                            Memory: {problem.memory_limit_megabytes} MiB
                        </span>
                        <span>Source size: 64 KiB</span>
                    </TitledSection>
                    <TitledSection title={"Submit"}>
                        <span>Submit code:</span>
                        <textarea
                            tw={"w-4/5"}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <SimpleButton
                            onClick={async () => {
                                setCode("");
                                const _ = http.post(
                                    "/submission/" + problem_id + "/",
                                    {
                                        code: btoa(code),
                                        language: "python",
                                    }
                                );
                            }}
                        >
                            Submit
                        </SimpleButton>
                        <span>Language: Python Only</span>
                    </TitledSection>
                </div>

                <Table tw={"w-full"}>
                    <TableHeadRow>
                        <TableHeadItem>Verdict</TableHeadItem>
                        <TableHeadItem>Time</TableHeadItem>
                        <TableHeadItem>Memory</TableHeadItem>
                        <TableHeadItem>Awarded points</TableHeadItem>
                    </TableHeadRow>
                    {submissions
                        .sort((b, a) => Number(BigInt(a.id) - BigInt(b.id)))
                        .slice(
                            0,
                            expanded || submissions.length <= 4
                                ? submissions.length
                                : 3
                        )
                        .map((s) => (
                            <TableRow key={s.id + ""}>
                                {s.verdict ? (
                                    <>
                                        <TableItem
                                            css={
                                                s.verdict === "accepted"
                                                    ? tw`text-green-600`
                                                    : tw`text-red-600`
                                            }
                                        >
                                            {s.verdict}
                                        </TableItem>
                                        <TableItem>
                                            {`${s.time_used_millis} ms`}
                                        </TableItem>
                                        <TableItem>
                                            {`${s.memory_used_megabytes} MiB`}
                                        </TableItem>
                                        <TableItem>
                                            {s.awardedscore} points
                                        </TableItem>
                                    </>
                                ) : (
                                    <TableItem
                                        colSpan={4}
                                        tw={"text-center text-yellow-800"}
                                    >
                                        Processing
                                    </TableItem>
                                )}
                            </TableRow>
                        ))}
                    {submissions.length > 4 && (
                        <tfoot>
                            <TableRow>
                                <TableItem
                                    colSpan={4}
                                    onClick={() =>
                                        setExpanded((previous) => !previous)
                                    }
                                    tw={"cursor-pointer"}
                                >
                                    <div
                                        tw={
                                            "flex gap-2 items-center justify-center"
                                        }
                                    >
                                        {expanded ? (
                                            <>
                                                <AiFillCaretUp />
                                                Collapse
                                            </>
                                        ) : (
                                            <>
                                                <AiFillCaretDown />
                                                Expand
                                            </>
                                        )}
                                    </div>
                                </TableItem>
                            </TableRow>
                        </tfoot>
                    )}
                </Table>
            </div>
            <div
                tw={
                    "p-4 bg-neutral-100 text-neutral-900 text-lg whitespace-pre-line border-2 border-solid border-neutral-200"
                }
            >
                {problem.description}
            </div>
        </div>
    );
};
