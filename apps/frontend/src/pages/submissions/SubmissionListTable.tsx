import {
    ProblemWithScore,
    SubmissionByProblemResponse,
    SubmissionWithUserInfo,
} from "@kontestis/models";
import { FC, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/all";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";

type Properties = {
    submissions?: SubmissionByProblemResponse[] | SubmissionWithUserInfo[];
    problem: ProblemWithScore;
    adminView: boolean;
};

export const SubmissionListTable: FC<Properties> = ({
    submissions,
    problem,
    adminView = false,
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    {adminView && <TableHeadItem>User</TableHeadItem>}
                    <TableHeadItem>Verdict</TableHeadItem>
                    <TableHeadItem>Time</TableHeadItem>
                    <TableHeadItem>Memory</TableHeadItem>
                    <TableHeadItem>Language</TableHeadItem>
                    <TableHeadItem>Points</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {!submissions && (
                    <TableRow>
                        <TableItem colSpan={5} tw={"text-center"}>
                            Loading submissions...
                        </TableItem>
                    </TableRow>
                )}
                {submissions?.length === 0 && (
                    <TableRow>
                        <TableItem colSpan={5} tw={"text-center"}>
                            No submissions yet :(
                        </TableItem>
                    </TableRow>
                )}
                {submissions
                    ?.sort((b, a) => Number(BigInt(a.id) - BigInt(b.id)))
                    .slice(0, expanded || submissions.length <= 4 ? submissions.length : 3)
                    .map((s) => (
                        <TableRow key={s.id.toString()}>
                            {!("completed" in s) || s.completed ? (
                                <>
                                    {adminView && !("completed" in s) && (
                                        <TableItem>{s.full_name}</TableItem>
                                    )}
                                    <TableItem
                                        css={
                                            s.verdict === "accepted"
                                                ? tw`text-green-600`
                                                : tw`text-red-600`
                                        }
                                    >
                                        <Link to={"/submission/" + s.id}>{s.verdict}</Link>
                                    </TableItem>
                                    <TableItem>{`${s.time_used_millis} ms`}</TableItem>
                                    <TableItem>{`${s.memory_used_megabytes} MiB`}</TableItem>
                                    <TableItem>{s.language}</TableItem>
                                    <TableItem>
                                        <ProblemScoreBox
                                            score={s.awarded_score}
                                            maxScore={problem.score}
                                        />
                                    </TableItem>
                                </>
                            ) : (
                                <TableItem colSpan={5} tw={"text-center text-yellow-800"}>
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
                            onClick={() => setExpanded((current) => !current)}
                            tw={"cursor-pointer"}
                        >
                            <div tw={"flex gap-2 items-center justify-center"}>
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
    );
};
