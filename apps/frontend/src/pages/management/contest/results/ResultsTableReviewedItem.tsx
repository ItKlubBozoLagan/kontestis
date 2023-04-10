import { ContestMemberWithInfo } from "@kontestis/models";
import { FC } from "react";

import { TableItem } from "../../../../components/Table";
import { useAllFinalSubmissions } from "../../../../hooks/submission/final/useAllFinalSubmissions";

type Properties = {
    member: ContestMemberWithInfo;
};

export const ResultsTableReviewedItem: FC<Properties> = ({ member }) => {
    const { data: finalSubmissions } = useAllFinalSubmissions([member.contest_id, member.user_id]);

    return (
        <TableItem>
            {finalSubmissions ? (
                finalSubmissions.some((finalSubmission) => !finalSubmission.reviewed) ? (
                    <span tw={"text-red-600"}>Not Reviewed</span>
                ) : (
                    <span tw={"text-green-600"}>Reviewed</span>
                )
            ) : (
                <span>Loading</span>
            )}
        </TableItem>
    );
};
