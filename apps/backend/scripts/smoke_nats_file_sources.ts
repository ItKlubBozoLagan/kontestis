/* eslint-disable unicorn/no-process-exit -- this CLI owns a long-lived backend NATS connection */
import { jetstream } from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";

import { Globals } from "../src/globals";
import { evaluateTestcasesNew, handleEvaluatorResponse } from "../src/lib/evaluation_rs";
import {
    EVALUATION_OBJECT_BUCKET,
    EVALUATION_REQUEST_STREAM,
    EVALUATION_WORKER_CONSUMER,
} from "../src/nats/evaluationContract";
import { getEvaluationObjectStore, initEvaluationNats } from "../src/nats/evaluationNats";
import { S3Client } from "../src/s3/S3";

const waitForObject = async (name: string) => {
    const deadline = Date.now() + 10_000;

    while (Date.now() < deadline) {
        if (await (await getEvaluationObjectStore()).info(name)) return;

        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`timed out waiting for restored object ${name}`);
};

const run = async () => {
    await initEvaluationNats(handleEvaluatorResponse);

    const workerConnection = await connect({
        servers: Globals.nats.servers,
        name: "kontestis-file-source-smoke-worker",
    });
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const smallKey = `nats-smoke/${suffix}-small.in`;
    const thresholdKey = `nats-smoke/${suffix}-threshold.out`;
    const bucket = Globals.s3.buckets.testcases;

    try {
        await S3Client.putObject(
            bucket,
            smallKey,
            Buffer.alloc(Globals.nats.objectThresholdBytes - 1)
        );
        await S3Client.putObject(
            bucket,
            thresholdKey,
            Buffer.alloc(Globals.nats.objectThresholdBytes)
        );

        const workerClient = jetstream(workerConnection);
        const worker = await workerClient.consumers.get(
            EVALUATION_REQUEST_STREAM,
            EVALUATION_WORKER_CONSUMER
        );
        const requestPromise = worker.next({ expires: 20_000 });
        const evaluationPromise = evaluateTestcasesNew(
            {
                problemId: 1n,
                language: "cpp",
                code: "int main() { return 0; }",
                evaluation_variant: "plain",
                legacy_evaluation: false,
            },
            [
                {
                    id: 3n,
                    input: { type: "s3_object", bucket, key: smallKey },
                    correct_output: { type: "s3_object", bucket, key: thresholdKey },
                },
            ],
            { time_limit_millis: 1000, memory_limit_megabytes: 256 }
        );
        const request = await requestPromise;

        if (!request) throw new Error("timed out waiting for file-source evaluation request");

        const payload = JSON.parse(new TextDecoder().decode(request.data));
        const evaluation = payload.BeginEvaluation.evaluation.Batch;
        const [testcase] = evaluation.testcases;

        if (testcase.input.type !== "nats_object") {
            throw new Error("file below the threshold did not use NATS Object Store");
        }

        if (testcase.output.type !== "s3_presigned_get") {
            throw new Error("file exactly at the threshold did not use a presigned S3 GET");
        }

        const objectStore = await getEvaluationObjectStore();

        await objectStore.delete(testcase.input.name);
        await workerClient.publish(
            payload.BeginEvaluation.response_subject,
            Buffer.from(
                JSON.stringify({
                    evaluation_id: evaluation.id,
                    type: "file_unavailable",
                    bucket: EVALUATION_OBJECT_BUCKET,
                    name: testcase.input.name,
                    request_delivery_count: 2,
                    retryable: true,
                })
            )
        );
        await waitForObject(testcase.input.name);

        await workerClient.publish(
            payload.BeginEvaluation.response_subject,
            Buffer.from(
                JSON.stringify({
                    evaluation_id: evaluation.id,
                    verdict: { type: "accepted" },
                    max_time: 5,
                    max_memory: 1024,
                    testcases: [
                        {
                            id: testcase.id,
                            verdict: { type: "accepted" },
                            time: 5,
                            memory: 1024,
                        },
                    ],
                })
            )
        );
        request.ack();

        const [result, error] = await evaluationPromise;

        if (error || result?.[0]?.verdict !== "accepted") {
            throw error ?? new Error("unexpected file-source smoke evaluation result");
        }

        const cleanedObject = await objectStore.info(testcase.input.name);

        if (cleanedObject && !cleanedObject.deleted) {
            throw new Error("evaluation object was not cleaned after the terminal response");
        }

        console.log("NATS file threshold and recovery smoke test passed");
    } finally {
        await Promise.all([
            S3Client.removeObject(bucket, smallKey),
            S3Client.removeObject(bucket, thresholdKey),
        ]);
        await workerConnection.drain();
    }
};

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
