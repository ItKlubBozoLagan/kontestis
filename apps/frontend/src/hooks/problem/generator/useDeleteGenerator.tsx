import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

export const useDeleteGenerator: MutationHandler<Snowflake, Generator, Snowflake> = (problemId) =>
    useMutation(
        (generatorId) => wrapAxios(http.delete(`/problem/${problemId}/generator/${generatorId}`)),
        invalidateOnSuccess([
            ["problem", problemId, "generator"],
            ["problem", problemId, "cluster"],
        ])
    );
