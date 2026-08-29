/* eslint-disable unicorn/no-process-exit -- this CLI owns a long-lived backend NATS connection */
import { jetstream } from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";

import { Globals } from "../src/globals";
import { evaluateTestcasesNew, handleEvaluatorResponse } from "../src/lib/evaluation_rs";
import {
    EVALUATION_REQUEST_STREAM,
    EVALUATION_WORKER_CONSUMER,
} from "../src/nats/evaluationContract";
import { initEvaluationNats } from "../src/nats/evaluationNats";

const run = async () => {
    await initEvaluationNats(handleEvaluatorResponse);

    const workerConnection = await connect({
        servers: Globals.nats.servers,
        name: "kontestis-evaluation-smoke-worker",
    });

    try {
        const workerClient = jetstream(workerConnection);
        const worker = await workerClient.consumers.get(
            EVALUATION_REQUEST_STREAM,
            EVALUATION_WORKER_CONSUMER
        );
        const requestPromise = worker.next({ expires: 10_000 });
        const evaluationPromise = evaluateTestcasesNew(
            {
                problemId: 1n,
                language: "cpp",
                code: "int main() { return 0; }",
                evaluation_variant: "plain",
                legacy_evaluation: false,
            },
            [{ id: 2n, input: "smoke input", correct_output: "smoke output" }],
            { time_limit_millis: 1000, memory_limit_megabytes: 256 }
        );

        const request = await requestPromise;

        if (!request) throw new Error("timed out waiting for evaluation request");

        const payload = JSON.parse(new TextDecoder().decode(request.data));
        const evaluation = payload.BeginEvaluation.evaluation.Batch;

        if (evaluation.testcases[0].input.type !== "inline") {
            throw new Error("smoke testcase input was not inline");
        }

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
                            id: evaluation.testcases[0].id,
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
            throw error ?? new Error("unexpected smoke evaluation result");
        }

        console.log("NATS evaluation request/response smoke test passed");
    } finally {
        await workerConnection.drain();
    }
};

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
