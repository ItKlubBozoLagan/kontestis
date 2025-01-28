import { ContestAnnouncement, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler } from "../../../api/http";

type CreateContestAnnouncementVariables = {
    message: string;
};

export const useCreateContestAnnouncement: MutationHandler<
    CreateContestAnnouncementVariables,
    ContestAnnouncement,
    Snowflake
> = (contestId, options) =>
    useMutation(
        (variables) => http.post(`/contest/${contestId}/announcement/`, variables),
        invalidateOnSuccess([["contests", contestId, "announcements"]], options)
    );
