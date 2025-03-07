import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

type SubmissionFileType = "in" | "out" | "sout";

type Properties = {
    submissionId: Snowflake;
    clusterId: Snowflake;
    testcaseId: Snowflake;
    type: SubmissionFileType;
};

export const useSubmissionFileUrl: QueryHandler<{ fileUrl: string }, Properties> = (
    properties,
    options
) =>
    useQuery({
        queryKey: [
            "submission",
            properties.submissionId,
            "files",
            properties.clusterId,
            properties.testcaseId,
        ],
        queryFn: () =>
            wrapAxios(
                http.get(
                    `/submission/files/${properties.submissionId}/${properties.clusterId}/${properties.testcaseId}/${properties.type}`
                )
            ),
        enabled: false,
        ...options,
    });
