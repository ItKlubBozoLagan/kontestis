import { FC, useState } from "react";
import { IconType } from "react-icons";
import {
    AiFillCaretDown,
    AiFillCaretUp,
    FiClock,
    FiCode,
    FiDatabase,
    FiUploadCloud,
} from "react-icons/all";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import { http } from "../../api/http";
import { SimpleButton } from "../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { useProblem } from "../../hooks/problem/useProblem";
import { useAllProblemSubmissions } from "../../hooks/submission/useAllProblemSubmissions";
import { useInterval } from "../../hooks/useInterval";
import { EvaluationLanguage } from "../../types/SubmissionType";

type Properties = {
    problem_id: string;
};

type LimitBoxProperties = {
    icon: IconType;
    title: string;
    value: string;
};

const LimitBox: FC<LimitBoxProperties> = ({ icon: Icon, title, value }) => {
    return (
        <div
            tw={
                "w-full bg-neutral-100 border-2 border-solid border-neutral-200 p-4 flex justify-between gap-4"
            }
        >
            <div tw={"flex items-center gap-4 text-lg"}>
                <Icon size={"18px"} />
                {title}
            </div>
            <span tw={"text-lg"}>{value}</span>
        </div>
    );
};

export const Problem: FC = () => {
    const { problem_id } = useParams<Properties>();

    const [expanded, setExpanded] = useState(false);
    const [language, setLanguage] = useState<EvaluationLanguage>("cpp");

    const [code, setCode] = useState("");

    const { data: problem } = useProblem(BigInt(problem_id ?? 0));

    const { data: submissions, refetch } = useAllProblemSubmissions(
        BigInt(problem_id ?? 0)
    );

    useInterval(() => {
        const _ = refetch();
    }, 1000);

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 py-10"}>
            <span tw={"text-neutral-800 text-3xl"}>{problem?.title}</span>
            <div tw={"flex flex-col gap-4"}>
                <div tw={"w-full flex gap-4"}>
                    <TitledSection title={"Limits"}>
                        <div
                            tw={
                                "flex flex-col items-center justify-between gap-4 w-full h-full"
                            }
                        >
                            <LimitBox
                                icon={FiClock}
                                title={"Time"}
                                value={
                                    (problem?.time_limit_millis ?? 0) + " ms"
                                }
                            />
                            <LimitBox
                                icon={FiDatabase}
                                title={"Memory"}
                                value={
                                    (problem?.memory_limit_megabytes ?? 0) +
                                    " MiB"
                                }
                            />
                            <LimitBox
                                icon={FiCode}
                                title={"Source size"}
                                value={"64 KiB"}
                            />
                            <LimitBox
                                icon={FiUploadCloud}
                                title={"Submission limit"}
                                value={`50 (${submissions?.length ?? 0} used)`}
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
                                setLanguage(
                                    event.target.value as EvaluationLanguage
                                )
                            }
                        >
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                            <option value="python">Python</option>
                        </select>
                        <SimpleButton
                            onClick={() => {
                                setCode("");

                                // TODO: react query mutations
                                const _ = http.post(
                                    "/submission/" + problem_id + "/",
                                    {
                                        code: btoa(code),
                                        language,
                                    }
                                );
                            }}
                        >
                            Submit
                        </SimpleButton>
                    </TitledSection>
                </div>

                <Table tw={"w-full"}>
                    <thead>
                        <TableHeadRow>
                            <TableHeadItem>Verdict</TableHeadItem>
                            <TableHeadItem>Time</TableHeadItem>
                            <TableHeadItem>Memory</TableHeadItem>
                            <TableHeadItem>Language</TableHeadItem>
                            <TableHeadItem>Points</TableHeadItem>
                        </TableHeadRow>
                    </thead>
                    <tbody>
                        {submissions
                            ?.sort((b, a) =>
                                Number(BigInt(a.id) - BigInt(b.id))
                            )
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
                                                <Link
                                                    to={"/submission/" + s.id}
                                                >
                                                    {s.verdict}
                                                </Link>
                                            </TableItem>
                                            <TableItem>
                                                {`${s.time_used_millis} ms`}
                                            </TableItem>
                                            <TableItem>
                                                {`${s.memory_used_megabytes} MiB`}
                                            </TableItem>
                                            <TableItem>{s.language}</TableItem>
                                            <TableItem>
                                                {s.awardedscore} points
                                            </TableItem>
                                        </>
                                    ) : (
                                        <TableItem
                                            colSpan={5}
                                            tw={"text-center text-yellow-800"}
                                        >
                                            Processing
                                        </TableItem>
                                    )}
                                </TableRow>
                            ))}
                    </tbody>
                    {submissions && submissions.length > 4 && (
                        <tfoot>
                            <TableRow>
                                <TableItem
                                    colSpan={5}
                                    onClick={() =>
                                        setExpanded((current) => !current)
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
                <ReactMarkdown>
                    {problem ? problem.description : "Loading"}
                </ReactMarkdown>
            </div>
        </div>
    );
};
