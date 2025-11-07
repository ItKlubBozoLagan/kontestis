import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Snowflake,
} from "@kontestis/models";
import { FC, useCallback } from "react";
import { FiChevronsLeft, FiDownload, FiX } from "react-icons/all";
import tw from "twin.macro";

import { http, wrapAxios } from "../../api/http";
import { CanContestMember } from "../../components/CanContestMember";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { Translated } from "../../components/Translated";
import { useContest } from "../../hooks/contest/useContest";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useProblem } from "../../hooks/problem/useProblem";
import { useSubmission } from "../../hooks/submission/useSubmission";
import { useSubmissionTestcases } from "../../hooks/submission/useSubmissionTestcases";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { downloadFile } from "../../util/download";

type Properties = {
    submissionId: bigint;
    clusterSubmissionId: bigint;
    clusterId: bigint;
    files: string[];
    back: () => void;
};

export const SubmissionTestcaseTable: FC<Properties> = ({
    clusterSubmissionId,
    clusterId,
    files,
    back,
    submissionId,
}) => {
    const { data: submission } = useSubmission(submissionId);
    const { data: problem } = useProblem(submission?.problem_id ?? 0n, { enabled: !!submission });
    const { data: contest } = useContest(problem?.contest_id ?? 0n, { enabled: !!problem });
    const { data: members } = useSelfContestMembers();
    const member = (members ?? []).find((member) => !!contest && member.contest_id === contest.id);

    const { data: testcaseSubmissions } = useSubmissionTestcases(clusterSubmissionId);

    const { user } = useAuthStore();

    const downloadSubmissionFile = useCallback(
        async (testcaseId: Snowflake, type: "in" | "out" | "sout") => {
            const { url } = await wrapAxios<{ url: string }>(
                http.get(`/submission/files/${submissionId}/${clusterId}/${testcaseId}/${type}`)
            );

            await downloadFile(url);
        },
        [submissionId, clusterId]
    );

    const { t } = useTranslation();

    const isContestFinished =
        contest && contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now();

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>
                        <div tw={"flex gap-2 items-center ml-[-0.5rem]"}>
                            <FiChevronsLeft
                                onClick={back}
                                tw={"hover:(text-sky-800 cursor-pointer) text-xl"}
                            />
                            <span>{t("submissions.table.head.testcase")}</span>
                        </div>
                    </TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.verdict")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.time")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.memory")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.points")}</TableHeadItem>
                    {isContestFinished ? (
                        <>
                            <TableHeadItem>Input</TableHeadItem>
                            <TableHeadItem>Output</TableHeadItem>
                            <TableHeadItem>Submission</TableHeadItem>
                        </>
                    ) : (
                        <CanContestMember
                            member={member}
                            permission={ContestMemberPermissions.VIEW_PRIVATE}
                            adminPermission={AdminPermissions.EDIT_CONTEST}
                        >
                            <TableHeadItem>Input</TableHeadItem>
                            <TableHeadItem>Output</TableHeadItem>
                            <TableHeadItem>Submission</TableHeadItem>
                        </CanContestMember>
                    )}
                </TableHeadRow>
            </thead>
            <tbody>
                {testcaseSubmissions
                    ?.sort((a, b) => Number(BigInt(a.testcase_id) - BigInt(b.testcase_id)))
                    .map((ts, index) => (
                        <TableRow key={ts.id.toString()}>
                            <TableItem>
                                <Translated translationKey="submissions.table.body.testcaseIndex">
                                    {String(index + 1)}
                                </Translated>
                            </TableItem>
                            <TableItem
                                css={
                                    ts.verdict === "accepted"
                                        ? tw`text-green-600`
                                        : tw`text-red-600`
                                }
                            >
                                {ts.verdict}
                            </TableItem>
                            <TableItem>{ts.time_used_millis} ms</TableItem>
                            <TableItem>{ts.memory_used_megabytes} MiB</TableItem>
                            <TableItem>
                                <Translated translationKey="submissions.table.body.pointsAchieved">
                                    {ts.awarded_score ?? "?"}
                                </Translated>
                            </TableItem>
                            {(isContestFinished ||
                                hasAdminPermission(
                                    user.permissions,
                                    AdminPermissions.EDIT_CONTEST
                                ) ||
                                (member &&
                                    hasContestPermission(
                                        member.contest_permissions,
                                        ContestMemberPermissions.VIEW_PRIVATE
                                    ))) && (
                                <>
                                    <TableItem>
                                        {files.includes(`${ts.testcase_id}.in`) ? (
                                            <FiDownload
                                                size={16}
                                                tw={"hover:cursor-pointer hover:text-blue-400"}
                                                onClick={() =>
                                                    downloadSubmissionFile(ts.testcase_id, "in")
                                                }
                                            />
                                        ) : (
                                            <FiX tw={"text-neutral-500"} size={16} />
                                        )}
                                    </TableItem>
                                    <TableItem>
                                        {files.includes(`${ts.testcase_id}.out`) ? (
                                            <FiDownload
                                                size={16}
                                                tw={"hover:cursor-pointer hover:text-blue-400"}
                                                onClick={() =>
                                                    downloadSubmissionFile(ts.testcase_id, "out")
                                                }
                                            />
                                        ) : (
                                            <FiX tw={"text-neutral-500"} size={16} />
                                        )}
                                    </TableItem>
                                    <TableItem>
                                        {files.includes(`${ts.testcase_id}.sout`) ? (
                                            <FiDownload
                                                size={16}
                                                tw={
                                                    "self-center hover:cursor-pointer hover:text-blue-400"
                                                }
                                                onClick={() =>
                                                    downloadSubmissionFile(ts.testcase_id, "sout")
                                                }
                                            />
                                        ) : (
                                            <FiX tw={"text-neutral-500"} size={16} />
                                        )}
                                    </TableItem>
                                </>
                            )}
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
