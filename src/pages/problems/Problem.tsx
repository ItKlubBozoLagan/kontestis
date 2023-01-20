import { FC, useEffect, useState } from "react";
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
        <div tw={"w-full flex flex-col justify-start items-center gap-4"}>
            <div tw={"text-neutral-800 text-3xl"}>{problem.title}</div>
            <div tw={"text-neutral-700 text-lg"}>{problem.description}</div>
            <div tw={"w-full flex justify-between gap-5"}>
                <TitledSection title={"Limits"}>
                    <div>Time: {problem.time_limit_millis}ms</div>
                    <div>Memory: {problem.memory_limit_megabytes} MiB</div>
                    <div>Source size: 64 KiB</div>
                </TitledSection>
                <TitledSection title={"Submit"}>
                    <div>Submit code:</div>
                    <textarea
                        tw={"w-4/5"}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <SimpleButton
                        onClick={async () => {
                            setCode("");
                            http.post("/submission/" + problem_id + "/", {
                                code: btoa(code),
                                language: "python",
                            }).then(() => {
                                location.reload();
                            });
                        }}
                    >
                        Submit
                    </SimpleButton>
                    <div>Language: Python Only</div>
                </TitledSection>
            </div>

            <Table tw={"w-full"}>
                <TableHeadRow>
                    <TableHeadItem>Verdict</TableHeadItem>
                    <TableHeadItem>Time</TableHeadItem>
                    <TableHeadItem>Memory</TableHeadItem>
                </TableHeadRow>
                {submissions
                    .sort((b, a) => Number(BigInt(a.id) - BigInt(b.id)))
                    .map((s) => (
                        <TableRow key={s.id + ""}>
                            <TableItem
                                tw={"text-red-600"}
                                css={
                                    s.verdict === "accepted"
                                        ? tw`text-green-600`
                                        : ""
                                }
                            >
                                {s.verdict ?? "Pending"}
                            </TableItem>
                            <TableItem>
                                {s.time_used_millis
                                    ? `${s.time_used_millis} ms`
                                    : "Pending"}
                            </TableItem>
                            <TableItem>
                                {s.memory_used_megabytes
                                    ? `${s.memory_used_megabytes} MiB`
                                    : "Pending"}
                            </TableItem>
                        </TableRow>
                    ))}
            </Table>
        </div>
    );
};
