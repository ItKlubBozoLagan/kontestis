import { RawSystemMetrics } from "@kontestis/models";
import systemInformation from "systeminformation";

import { CachedValue } from "../../utils/CachedValue";

export const fetchRawSystemMetrics = async (): Promise<RawSystemMetrics> => {
    const cpuData = await systemInformation.currentLoad();
    const memoryData = await systemInformation.mem();
    const osInfo = await systemInformation.osInfo();

    return {
        type: "raw",
        cpus: cpuData.cpus.length,
        memoryMegabytes: Number(BigInt(memoryData.total) >> 20n),
        cpuUsage: cpuData.currentLoad * cpuData.cpus.length,
        memoryUsageMegabytes: Number(BigInt(memoryData.active) >> 20n),
        osPrettyName: osInfo.distro,
        hostname: osInfo.hostname,
    };
};

const rawMetrics = new CachedValue<RawSystemMetrics>(fetchRawSystemMetrics, 800);

export const getRawSystemMetrics = () => rawMetrics.get();
