import { hostname } from "node:os";

import { KubernetesSystemMetrics } from "@kontestis/models";
import { AppsV1Api, CoreV1Api, KubeConfig, Metrics } from "@kubernetes/client-node";

import { CachedValue } from "../../utils/CachedValue";

type KubernetesRequirements = {
    kubeConfig?: KubeConfig;
    ownPodName: string;
};

// eh
let clusterKubeConfig: KubeConfig;

// assumes kubernetes environment
//  will throw if something fails
//  provider in metrics.ts then falls back to raw metrics
export const fetchKubernetesSystemMetrics = async (
    requirements?: KubernetesRequirements
    // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<KubernetesSystemMetrics> => {
    if (!clusterKubeConfig && !requirements?.kubeConfig) {
        clusterKubeConfig = new KubeConfig();
        clusterKubeConfig.loadFromCluster();
    }

    const kubeConfig = requirements?.kubeConfig ?? clusterKubeConfig;

    const ownPodName = requirements?.ownPodName ?? hostname();

    const coreApi = kubeConfig.makeApiClient(CoreV1Api);
    const appsApi = kubeConfig.makeApiClient(AppsV1Api);

    const nodes = (await coreApi.listNode()).body.items;

    // maybe there's an easier/better way of doing this
    //  the goal is to avoid any extra setup while creating the pod spec
    const allPods = (await coreApi.listPodForAllNamespaces()).body.items;
    const ownPod = allPods.find((it) => it.metadata?.name === ownPodName)!;

    const namespace = ownPod.metadata?.namespace;

    if (!namespace) throw new Error("kubernetes metrics: namespace not found");

    const owners = ownPod.metadata?.ownerReferences;

    if (!owners || owners.length === 0 || owners[0].kind !== "ReplicaSet")
        throw new Error("kubernetes metrics: replicaset not found");

    const replicaSet = (await appsApi.readNamespacedReplicaSet(owners[0].name, namespace)).body;
    const templateHash = replicaSet.metadata?.labels?.["pod-template-hash"];

    if (!replicaSet || !templateHash) throw new Error("kubernetes metrics: invalid replica set");

    const appScale = replicaSet.status?.replicas ?? 1;

    const sisterPodNames = allPods
        .filter(
            (it) =>
                it.metadata?.labels?.["pod-template-hash"] === templateHash &&
                it.metadata?.namespace === namespace
        )
        .map((pod) => pod.metadata?.name ?? "")
        .filter(Boolean);

    const metrics = new Metrics(kubeConfig);

    const nodeMetrics = (await metrics.getNodeMetrics()).items.map((it) => ({
        ...it,
        ...nodes.find((node) => node.metadata?.name === it.metadata.name),
    }));

    const nodeInfoWithUsage = nodeMetrics.map((node) => ({
        name: node.metadata.name!,
        osPrettyName: node.status?.nodeInfo?.osImage!,
        cpus: Number(node.status?.capacity?.cpu ?? "0"),
        memoryMegabytes: Number(node.status?.capacity?.memory.slice(0, -2) ?? "0") / 1024,
        cpuUsage: Number(node.usage.cpu.slice(0, -1)) / 1e7,
        memoryUsageMegabytes: Number(node.usage.memory.slice(0, -2)) / 1024,
    }));

    const podMetrics = (await metrics.getPodMetrics(namespace)).items;

    const podInfoWithUsage = podMetrics
        .filter((it) => sisterPodNames.includes(it.metadata.name))
        .map((pod) => ({
            name: pod.metadata.name,
            ...pod.containers.reduce(
                (accumulator, current) => ({
                    cpuUsage: accumulator.cpuUsage + Number(current.usage.cpu.slice(0, -1)) / 1e7,
                    memoryUsageMegabytes:
                        accumulator.memoryUsageMegabytes +
                        Number(current.usage.memory.slice(0, -2)) / 1024,
                }),
                { cpuUsage: 0, memoryUsageMegabytes: 0 }
            ),
        }));

    return {
        type: "kubernetes",
        cpus: nodeInfoWithUsage.reduce((accumulator, current) => accumulator + current.cpus, 0),
        memoryMegabytes: nodeInfoWithUsage.reduce(
            (accumulator, current) => accumulator + current.memoryMegabytes,
            0
        ),
        cpuUsage: nodeInfoWithUsage.reduce(
            (accumulator, current) => accumulator + current.cpuUsage,
            0
        ),
        memoryUsageMegabytes: nodeInfoWithUsage.reduce(
            (accumulator, current) => accumulator + current.memoryUsageMegabytes,
            0
        ),
        kubeData: {
            appScale,
            sisterPodNames,
            nodes: nodeInfoWithUsage,
            pods: podInfoWithUsage,
        },
    };
};

const kubernetesMetrics = new CachedValue<
    KubernetesSystemMetrics,
    Parameters<typeof fetchKubernetesSystemMetrics>
>(fetchKubernetesSystemMetrics, 800);

export const getKubernetesSystemMetrics = (requirements?: KubernetesRequirements) => {
    return kubernetesMetrics.get(requirements);
};
