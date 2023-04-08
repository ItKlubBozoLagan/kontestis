// data that all types of SystemMetrics should inherit from
export type BaseSystemMetrics = {
    cpus: number;
    memoryMegabytes: number;
    cpuUsage: number;
    memoryUsageMegabytes: number;
};

export type KubernetesSystemMetrics = BaseSystemMetrics & {
    type: "kubernetes";
    kubeData: {
        appScale: number;
        sisterPodNames: string[];
        nodes: (BaseSystemMetrics & { name: string; osPrettyName: string })[];
        pods: {
            name: string;
            cpuUsage: number;
            memoryUsageMegabytes: number;
        }[];
    };
};

export type RawSystemMetrics = BaseSystemMetrics & {
    type: "raw";
};

export type SystemMetrics = RawSystemMetrics | KubernetesSystemMetrics;
