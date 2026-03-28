import { FC, useMemo } from "react";
import { FiMessageSquare } from "react-icons/all";
import { Link } from "react-router-dom";

import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { useTranslation } from "../../../../hooks/useTranslation";

export const ContestQuestionsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: threads } = useAllContestQuestions(contest.id);
    const { data: members } = useAllContestMembers([contest.id, {}]);

    const { t } = useTranslation();

    const getMemberName = (memberId: bigint) => {
        const member = members?.find((m) => m.id === memberId);

        return member?.full_name ?? t("contests.management.individual.questions.unknownMember");
    };

    const sortedThreads = useMemo(
        () =>
            [...(threads ?? [])].sort((a, b) => {
                const aTime = a.last_message_at?.getTime();
                const bTime = b.last_message_at?.getTime();

                if (aTime && bTime) return bTime - aTime;

                if (a.id === b.id) return 0;

                return a.id > b.id ? -1 : 1;
            }),
        [threads]
    );

    if (sortedThreads.length === 0) {
        return (
            <span tw={"w-full text-center"}>
                {t("contests.management.individual.questions.empty")}
            </span>
        );
    }

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>
                        {t("contests.management.individual.questions.table.subject")}
                    </TableHeadItem>
                    <TableHeadItem>
                        {t("contests.management.individual.questions.table.member")}
                    </TableHeadItem>
                    <TableHeadItem>
                        {t("contests.management.individual.questions.table.status")}
                    </TableHeadItem>
                    <TableHeadItem>
                        {t("contests.management.individual.questions.table.lastActivity")}
                    </TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {sortedThreads.map((thread) => {
                    const needsReply =
                        !thread.last_message_member_id ||
                        thread.last_message_member_id === thread.contest_member_id;

                    return (
                        <TableRow key={thread.id.toString()}>
                            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                                <Link to={`${thread.id}`} tw={"flex items-center gap-2"}>
                                    <FiMessageSquare tw={"text-lg shrink-0"} />
                                    <span tw={"truncate max-w-[300px]"}>{thread.question}</span>
                                </Link>
                            </TableItem>
                            <TableItem>{getMemberName(thread.contest_member_id)}</TableItem>
                            <TableItem>
                                {needsReply ? (
                                    <span tw={"text-yellow-700"}>
                                        {t(
                                            "contests.management.individual.questions.table.needsReply"
                                        )}
                                    </span>
                                ) : (
                                    <span tw={"text-green-700"}>
                                        {t(
                                            "contests.management.individual.questions.table.replied"
                                        )}
                                    </span>
                                )}
                            </TableItem>
                            <TableItem>
                                {thread.last_message_at
                                    ? thread.last_message_at.toLocaleString()
                                    : "-"}
                            </TableItem>
                        </TableRow>
                    );
                })}
            </tbody>
        </Table>
    );
};
