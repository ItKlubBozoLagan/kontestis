import { FC, useEffect, useState } from "react";
import { useParams } from "react-router";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/http";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
} from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { ClusterSubmissionType } from "../../types/ClusterSubmissionType";
import { SubmissionType } from "../../types/SubmissionType";

type Properties = {
    submission_id: string;
};

export const Submission: FC = () => {
    const { submission_id } = useParams<Properties>();

    const [submission, setSubmission] = useState<SubmissionType>({
        id: BigInt(0),
        user_id: BigInt(0),
        problem_id: BigInt(0),
        code: "Loading",
        language: "python",
        completed: false,
    });

    const [clusters, setClusters] = useState<ClusterSubmissionType[]>([]);

    useEffect(() => {
        wrapAxios<SubmissionType>(
            http.get("/submission/submission/" + submission_id + "/")
        ).then(setSubmission);

        wrapAxios<ClusterSubmissionType[]>(
            http.get("/submission/cluster/" + submission_id + "/")
        ).then(setClusters);
    }, []);

    return (
        <div tw={"w-full h-full py-12 flex flex-col gap-5"}>
            <TitledSection title={"Code"}>
                <textarea
                    value={atob(submission.code)}
                    tw={"w-full h-[500px]"}
                ></textarea>
            </TitledSection>
            <Table tw={"w-full"}>
                <TableHeadRow>
                    <TableHeadItem>Cluster</TableHeadItem>
                    <TableHeadItem>Verdict</TableHeadItem>
                    <TableHeadItem>Time</TableHeadItem>
                    <TableHeadItem>Memory</TableHeadItem>
                    <TableHeadItem>Score</TableHeadItem>
                </TableHeadRow>
                {clusters
                    .sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)))
                    .map((c, index) => (
                        <TableHeadRow key={c.id + ""}>
                            <TableItem>Cluster #{index + 1}:</TableItem>
                            <TableItem
                                css={
                                    c.verdict === "accepted"
                                        ? tw`text-green-600`
                                        : tw`text-red-600`
                                }
                            >
                                {c.verdict}
                            </TableItem>
                            <TableItem>{c.time_used_millis} ms</TableItem>
                            <TableItem>{c.memory_used_megabytes} MiB</TableItem>
                            <TableItem>{c.awardedscore} points</TableItem>
                        </TableHeadRow>
                    ))}
            </Table>
        </div>
    );
};
