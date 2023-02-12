import { ContestAnnouncement, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler } from "../../api/http";

type CreateContestAnnouncementVariables = {
    message: string;
};

export const useCreateContestAnnouncement: MutationHandler<
    CreateContestAnnouncementVariables,
    ContestAnnouncement,
    Snowflake
> = (contest_id, options) =>
    useMutation(
        (variables) => http.post("/contest/announcement/" + contest_id, variables),
        options
    );
