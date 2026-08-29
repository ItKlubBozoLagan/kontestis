import {
    AckPolicy,
    type ConsumerConfig,
    DeliverPolicy,
    DiscardPolicy,
    RetentionPolicy,
    StorageType,
    type StreamConfig,
} from "@nats-io/jetstream";
import { nanos } from "@nats-io/nats-core";

import { Globals } from "../globals";

export const EVALUATION_REQUEST_STREAM = "KONTESTIS_EVALUATION_REQUESTS_V1";
export const EVALUATION_RESULT_STREAM = "KONTESTIS_EVALUATION_RESULTS_V1";
export const EVALUATION_OBJECT_BUCKET = "KONTESTIS_EVALUATION_FILES_V1";
export const EVALUATION_WORKER_CONSUMER = "evaluation-workers-v1";

export const EVALUATION_MAX_MESSAGE_BYTES = 64 * 1024 * 1024;
export const EVALUATION_FILE_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

const DAY_MILLIS = 24 * 60 * 60 * 1000;

export const evaluationSubjects = {
    requests: `${Globals.nats.evaluationNamespace}.requests`,
    responses: `${Globals.nats.evaluationNamespace}.responses.>`,
    responseForInstance: (instanceId: string) =>
        `${Globals.nats.evaluationNamespace}.responses.${instanceId}.>`,
    responseForEvaluation: (instanceId: string, evaluationId: number) =>
        `${Globals.nats.evaluationNamespace}.responses.${instanceId}.${evaluationId}`,
};

const baseStreamConfig = {
    retention: RetentionPolicy.Workqueue,
    storage: StorageType.File,
    discard: DiscardPolicy.New,
    max_msgs: -1,
    max_msgs_per_subject: -1,
    max_bytes: Globals.nats.queueMaxBytes,
    max_age: nanos(6 * DAY_MILLIS),
    max_msg_size: EVALUATION_MAX_MESSAGE_BYTES,
    duplicate_window: nanos(10 * 60 * 1000),
    num_replicas: Globals.nats.replicas,
    max_consumers: -1,
} satisfies Partial<StreamConfig>;

export const evaluationRequestStreamConfig = {
    ...baseStreamConfig,
    name: EVALUATION_REQUEST_STREAM,
    description: "Kontestis evaluator requests (schema v1)",
    subjects: [evaluationSubjects.requests],
} satisfies Partial<StreamConfig> & Pick<StreamConfig, "name">;

export const evaluationResultStreamConfig = {
    ...baseStreamConfig,
    name: EVALUATION_RESULT_STREAM,
    description: "Kontestis evaluator responses (schema v1)",
    subjects: [evaluationSubjects.responses],
} satisfies Partial<StreamConfig> & Pick<StreamConfig, "name">;

export const evaluationWorkerConsumerConfig = {
    durable_name: EVALUATION_WORKER_CONSUMER,
    name: EVALUATION_WORKER_CONSUMER,
    description: "Shared pull consumer for Kontestis evaluator workers",
    filter_subject: evaluationSubjects.requests,
    ack_policy: AckPolicy.Explicit,
    deliver_policy: DeliverPolicy.All,
    ack_wait: nanos(2 * 60 * 1000),
    max_deliver: -1,
    max_ack_pending: 1024,
} satisfies Partial<ConsumerConfig>;

export const evaluationResponseConsumerConfig = (instanceId: string) => {
    const durableName = `evaluation-backend-${instanceId}-v1`;

    return {
        durable_name: durableName,
        name: durableName,
        description: `Evaluator responses for backend instance ${instanceId}`,
        filter_subject: evaluationSubjects.responseForInstance(instanceId),
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All,
        ack_wait: nanos(2 * 60 * 1000),
        max_deliver: -1,
        max_ack_pending: 1024,
        inactive_threshold: nanos(DAY_MILLIS),
    } satisfies Partial<ConsumerConfig>;
};
