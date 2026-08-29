import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type GrafanaSession = {
    embedUrl: string;
};

export const useGrafanaSession: MutationHandler<void, GrafanaSession> = (options) =>
    useMutation(() => wrapAxios(http.post("/stats/admin/grafana/session")), options);
