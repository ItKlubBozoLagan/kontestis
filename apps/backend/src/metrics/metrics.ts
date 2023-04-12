import { SystemMetrics } from "@kontestis/models";

import { getKubernetesSystemMetrics } from "./providers/kubernetes";
import { getRawSystemMetrics } from "./providers/raw";

// we'll leave the providers to cache their outputs, seems more appropriate for this use case
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
    if (!process.env.KUBERNETES_SERVICE_HOST) return getRawSystemMetrics();

    // must be kubernetes
    //  in case more providers are added, change this function accordingly
    // ----
    // this feels weird, but basic fall back to raw metrics
    return getKubernetesSystemMetrics().catch(getRawSystemMetrics);
};
