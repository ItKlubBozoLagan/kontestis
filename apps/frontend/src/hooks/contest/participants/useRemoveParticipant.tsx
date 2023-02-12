import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

export const useRemoveParticipant: MutationHandler<Snowflake, undefined, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (userId) => wrapAxios(http.delete("/contest/members/" + contestId + "/" + userId)),
        options
    );
