import { readFileSync } from "node:fs";

import {
    type ConsumerConfig,
    jetstream,
    type JetStreamManager,
    jetstreamManager,
    StorageType,
    type StreamConfig,
} from "@nats-io/jetstream";
import { credsAuthenticator, nanos, type NatsConnection } from "@nats-io/nats-core";
import { Objm } from "@nats-io/obj";
import { connect } from "@nats-io/transport-node";

import { Globals } from "../globals";
import {
    EVALUATION_OBJECT_BUCKET,
    EVALUATION_REQUEST_STREAM,
    evaluationRequestStreamConfig,
    evaluationResultStreamConfig,
    evaluationWorkerConsumerConfig,
} from "./evaluationContract";

const connectionOptions = (credsFile?: string) => ({
    servers: Globals.nats.servers,
    name: `kontestis-evaluation-provision-${Globals.nats.evaluationInstanceId}`,
    authenticator: credsFile ? credsAuthenticator(readFileSync(credsFile)) : undefined,
});

export const connectEvaluationNats = (credsFile: string | undefined, name: string) =>
    connect({ ...connectionOptions(credsFile), name });

const assertStreamCompatibility = (actual: StreamConfig, desired: Partial<StreamConfig>) => {
    if (actual.retention !== desired.retention || actual.storage !== desired.storage) {
        throw new Error(
            `NATS stream ${actual.name} has incompatible retention/storage; refusing to recreate it`
        );
    }
};

export const ensureStream = async (
    manager: JetStreamManager,
    desired: Partial<StreamConfig> & Pick<StreamConfig, "name">
) => {
    try {
        const current = await manager.streams.info(desired.name);

        assertStreamCompatibility(current.config, desired);
        await manager.streams.update(desired.name, desired);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (!message.toLowerCase().includes("stream not found")) throw error;

        await manager.streams.add(desired);
    }
};

export const ensureConsumer = async (
    manager: JetStreamManager,
    stream: string,
    desired: Partial<ConsumerConfig> & { durable_name?: string; name?: string }
) => {
    const name = desired.durable_name ?? desired.name;

    if (!name) throw new Error("durable NATS consumer name is required");

    try {
        const current = await manager.consumers.info(stream, name);

        if (
            current.config.ack_policy !== desired.ack_policy ||
            current.config.deliver_policy !== desired.deliver_policy ||
            current.config.filter_subject !== desired.filter_subject
        ) {
            throw new Error(`NATS consumer ${name} has an incompatible immutable configuration`);
        }

        await manager.consumers.update(stream, name, desired);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (!message.toLowerCase().includes("consumer not found")) throw error;

        await manager.consumers.add(stream, desired);
    }
};

export const ensureEvaluationObjectStore = async (connection: NatsConnection) => {
    const objectTtl = nanos(7 * 24 * 60 * 60 * 1000);
    const store = await new Objm(jetstream(connection)).create(EVALUATION_OBJECT_BUCKET, {
        description: "Ephemeral evaluator testcase files (schema v1)",
        storage: StorageType.Memory,
        replicas: Globals.nats.replicas,
        max_bytes: Globals.nats.objectMaxBytes,
        ttl: objectTtl,
    });
    let status = await store.status();

    if (status.storage !== StorageType.Memory || status.replicas !== Globals.nats.replicas) {
        throw new Error(`NATS object store ${EVALUATION_OBJECT_BUCKET} has incompatible settings`);
    }

    if (
        status.streamInfo.config.max_bytes !== Globals.nats.objectMaxBytes ||
        status.ttl !== objectTtl
    ) {
        const manager = await jetstreamManager(connection);

        await manager.streams.update(status.streamInfo.config.name, {
            max_bytes: Globals.nats.objectMaxBytes,
            max_age: objectTtl,
        });
        status = await store.status();

        if (
            status.streamInfo.config.max_bytes !== Globals.nats.objectMaxBytes ||
            status.ttl !== objectTtl
        ) {
            throw new Error(
                `NATS object store ${EVALUATION_OBJECT_BUCKET} could not be reconciled`
            );
        }
    }

    return store;
};

export const provisionEvaluationNats = async () => {
    const connection = await connectEvaluationNats(
        Globals.nats.provisionCredsFile ?? Globals.nats.credsFile,
        "kontestis-evaluation-provision"
    );

    try {
        const manager = await jetstreamManager(connection);

        await ensureStream(manager, evaluationRequestStreamConfig);
        await ensureStream(manager, evaluationResultStreamConfig);
        await ensureConsumer(manager, EVALUATION_REQUEST_STREAM, evaluationWorkerConsumerConfig);
        await ensureEvaluationObjectStore(connection);
    } finally {
        await connection.drain();
    }
};

export { EVALUATION_WORKER_CONSUMER } from "./evaluationContract";
