import { ContestChatMessage, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type SendMessageVariables = {
    content: string;
};

export const useSendMessage: MutationHandler<
    SendMessageVariables,
    ContestChatMessage,
    [Snowflake, Snowflake]
> = ([contestId, threadId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.post(`/contest/${contestId}/question/${threadId}/messages`, variables)),
        invalidateOnSuccess(
            [
                ["contests", contestId, "questions", threadId, "messages"],
                ["contests", contestId, "questions"],
            ],
            options
        )
    );
