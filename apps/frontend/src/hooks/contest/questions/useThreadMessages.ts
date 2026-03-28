import { ContestChatMessageWithAuthor, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useThreadMessages: QueryHandler<
    ContestChatMessageWithAuthor[],
    [Snowflake, Snowflake]
> = ([contestId, threadId], ...options) =>
    useQuery({
        queryKey: ["contests", contestId, "questions", threadId, "messages"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/question/${threadId}/messages`)),
        refetchInterval: 5000,
        ...options,
    });
