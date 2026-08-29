import { jetstream, type JetStreamClient, jetstreamManager, type JsMsg } from "@nats-io/jetstream";
import type { NatsConnection } from "@nats-io/nats-core";
import type { ObjectStore } from "@nats-io/obj";

import { Globals } from "../globals";
import { Logger } from "../lib/logger";
import {
    EVALUATION_RESULT_STREAM,
    evaluationResponseConsumerConfig,
    evaluationSubjects,
} from "./evaluationContract";
import { connectEvaluationNats, ensureConsumer, ensureEvaluationObjectStore } from "./provision";

let connection: NatsConnection | undefined;
let client: JetStreamClient | undefined;
let objectStore: ObjectStore | undefined;
let objectStorePromise: Promise<ObjectStore> | undefined;
const ERR_NATS_NOT_CONNECTED = "evaluation NATS is not connected";

const openObjectStore = async () => {
    if (!connection) throw new Error(ERR_NATS_NOT_CONNECTED);

    objectStorePromise ??= ensureEvaluationObjectStore(connection).finally(() => {
        objectStorePromise = undefined;
    });
    objectStore = await objectStorePromise;

    return objectStore;
};

export const getEvaluationObjectStore = async (forceReopen: boolean = false) => {
    if (forceReopen) objectStore = undefined;

    return objectStore ?? openObjectStore();
};

export const publishEvaluationRequest = async (evaluationId: number, payload: Uint8Array) => {
    if (!client) throw new Error(ERR_NATS_NOT_CONNECTED);

    return client.publish(evaluationSubjects.requests, payload, {
        msgID: `evaluation-${evaluationId}`,
    });
};

const consumeResponses = async (onMessage: (message: JsMsg) => Promise<void>) => {
    if (!client) throw new Error(ERR_NATS_NOT_CONNECTED);

    const config = evaluationResponseConsumerConfig(Globals.nats.evaluationInstanceId);
    const consumer = await client.consumers.get(EVALUATION_RESULT_STREAM, config.durable_name!);
    const messages = await consumer.consume();

    for await (const message of messages) await onMessage(message);
};

export const initEvaluationNats = async (onMessage: (message: JsMsg) => Promise<void>) => {
    connection = await connectEvaluationNats(
        Globals.nats.credsFile,
        `kontestis-backend-${Globals.nats.evaluationInstanceId}`
    );
    client = jetstream(connection);

    await getEvaluationObjectStore(true);

    const manager = await jetstreamManager(connection);
    const responseConfig = evaluationResponseConsumerConfig(Globals.nats.evaluationInstanceId);

    await ensureConsumer(manager, EVALUATION_RESULT_STREAM, responseConfig);

    const runConsumer = async () => {
        try {
            await consumeResponses(onMessage);
        } catch (error) {
            Logger.error("NATS evaluator response consumer failed", String(error));
            setTimeout(runConsumer, 10_000);
        }
    };

    void runConsumer();
};
