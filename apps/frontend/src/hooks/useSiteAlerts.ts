import { useMemo } from "react";

import { R } from "../util/remeda";
import { useNotifications } from "./notifications/useNotifications";

export const useSiteAlerts = () => {
    const { data: notifications } = useNotifications();

    return useMemo(
        () =>
            R.sortBy(
                (notifications ?? []).filter((it) => it.type === "alert"),
                [(it) => it.created_at, "desc"]
            ),
        [notifications]
    );
};
