import assert from "node:assert";

import { EvaluationLanguage, EvaluationResult, Problem } from "@kontestis/models";
import type { JsMsg } from "@nats-io/jetstream";
import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { AxiosError } from "axios";

import { Globals } from "../globals";
import {
    EVALUATION_FILE_URL_TTL_SECONDS,
    EVALUATION_OBJECT_BUCKET,
    evaluationSubjects,
} from "../nats/evaluationContract";
import {
    EvaluationFileInput,
    EvaluationFileOrigin,
    EvaluationFileSource,
} from "../nats/evaluationFiles";
import {
    getEvaluationObjectStore,
    initEvaluationNats,
    publishEvaluationRequest,
} from "../nats/evaluationNats";
import { S3Client } from "../s3/S3";
import { s3OfflinePresignGetObject } from "../utils/s3";
import { readBucketStream } from "../utils/stream";
import { AxiosEvaluationResponse, EvaluationInputTestcase, ProblemDetails } from "./evaluation";
import { Logger } from "./logger";

type EvaluationTestcase = {
    id: string;
    input: EvaluationFileSource;
    output: EvaluationFileSource;
};

type BatchEvaluationPayload = {
    id: number;
    code: string;
    language: EvaluationLanguage;
    testcases: EvaluationTestcase[];
    time_limit: number;
    memory_limit: number;
    evaluate_all: boolean;
    checker?: { script: string; language: EvaluationLanguage };
};

type InteractiveEvaluationPayload = Omit<BatchEvaluationPayload, "checker"> & {
    checker: { script: string; language: EvaluationLanguage };
};

type OutputOnlyEvaluationPayload = Pick<BatchEvaluationPayload, "id" | "checker"> & {
    output: string;
    testcase: EvaluationTestcase;
};

type PreparedFiles = {
    testcases: EvaluationTestcase[];
    origins: Map<string, EvaluationFileOrigin>;
    objectNames: Set<string>;
};

const readS3Object = async (bucket: string, key: string) => {
    const stream = await S3Client.getObject(bucket, key);

    return Buffer.concat(await readBucketStream<Buffer>(stream));
};

const putEvaluationObject = async (name: string, data: Uint8Array) => {
    try {
        const store = await getEvaluationObjectStore();

        await store.putBlob({ name }, data);
    } catch (error) {
        Logger.error("NATS object write failed; reopening the memory bucket", String(error));
        const store = await getEvaluationObjectStore(true);

        await store.putBlob({ name }, data);
    }
};

const prepareFileSource = async (
    evaluationId: number,
    testcaseId: string,
    role: "input" | "output",
    file: EvaluationFileInput,
    prepared: PreparedFiles
): Promise<EvaluationFileSource> => {
    if (typeof file === "string") return { type: "inline", data: file };

    const stat = await S3Client.statObject(file.bucket, file.key);

    if (stat.size >= Globals.nats.objectThresholdBytes) {
        const expiresAt = new Date(Date.now() + EVALUATION_FILE_URL_TTL_SECONDS * 1000);
        const url = await s3OfflinePresignGetObject(
            file.bucket,
            file.key,
            EVALUATION_FILE_URL_TTL_SECONDS,
            undefined,
            Globals.s3.evaluatorInstanceUrl
        );

        return {
            type: "s3_presigned_get",
            url,
            size_bytes: stat.size,
            etag: stat.etag,
            expires_at: expiresAt.toISOString(),
        };
    }

    const name = `${evaluationId}-${testcaseId}-${role}`;
    const data = await readS3Object(file.bucket, file.key);

    await putEvaluationObject(name, data);
    prepared.origins.set(name, { bucket: file.bucket, key: file.key });
    prepared.objectNames.add(name);

    return {
        type: "nats_object",
        bucket: EVALUATION_OBJECT_BUCKET,
        name,
        size_bytes: stat.size,
    };
};

const prepareTestcases = async (
    evaluationId: number,
    testcases: EvaluationInputTestcase[]
): Promise<PreparedFiles> => {
    const prepared: PreparedFiles = {
        testcases: [],
        origins: new Map(),
        objectNames: new Set(),
    };

    const tasks = testcases.map(async (testcase) => {
        const id = testcase.id.toString();

        return {
            id,
            input: await prepareFileSource(evaluationId, id, "input", testcase.input, prepared),
            output: await prepareFileSource(
                evaluationId,
                id,
                "output",
                testcase.correct_output,
                prepared
            ),
        };
    });

    try {
        prepared.testcases = await Promise.all(tasks);
    } catch (error) {
        await Promise.allSettled(tasks);
        await cleanupObjects(prepared.objectNames);
        throw error;
    }

    return prepared;
};

const generateBatchPayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcases: EvaluationTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">,
    evaluateAll: boolean = false
): { Batch: BatchEvaluationPayload } => ({
    Batch: {
        id: evaluationId,
        code: problemDetails.code,
        language: problemDetails.language,
        testcases,
        time_limit: problem.time_limit_millis,
        memory_limit: problem.memory_limit_megabytes * 1024,
        evaluate_all: evaluateAll,
        checker:
            problemDetails.evaluator && problemDetails.evaluator_language
                ? {
                      script: problemDetails.evaluator,
                      language: problemDetails.evaluator_language,
                  }
                : undefined,
    },
});

const generateOutputOnlyPayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcase: EvaluationTestcase
): { OutputOnly: OutputOnlyEvaluationPayload } => ({
    OutputOnly: {
        id: evaluationId,
        output: problemDetails.code,
        testcase,
        checker:
            problemDetails.evaluator && problemDetails.evaluator_language
                ? {
                      script: problemDetails.evaluator,
                      language: problemDetails.evaluator_language,
                  }
                : undefined,
    },
});

const generateInteractivePayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcases: EvaluationTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">,
    evaluateAll: boolean = false
): { Interactive: InteractiveEvaluationPayload } => {
    assert(problemDetails.evaluator !== undefined);
    assert(problemDetails.evaluator_language !== undefined);

    return {
        Interactive: {
            ...generateBatchPayload(evaluationId, problemDetails, testcases, problem, evaluateAll)
                .Batch,
            checker: {
                script: problemDetails.evaluator,
                language: problemDetails.evaluator_language,
            },
        },
    };
};

const VerdictSchema = Type.Object({
    type: Type.String(),
    data: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const SuccessfulEvaluationSchema = Type.Object({
    evaluation_id: Type.Number(),
    verdict: VerdictSchema,
    max_time: Type.Number(),
    max_memory: Type.Number(),
    compiler_output: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    testcases: Type.Array(
        Type.Object({
            id: Type.String(),
            verdict: VerdictSchema,
            time: Type.Number(),
            memory: Type.Number(),
            error: Type.Optional(Type.Union([Type.String(), Type.Null()])),
            output: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        })
    ),
});

const FileUnavailableSchema = Type.Object({
    evaluation_id: Type.Number(),
    type: Type.Literal("file_unavailable"),
    bucket: Type.String(),
    name: Type.String(),
    request_delivery_count: Type.Number(),
    retryable: Type.Boolean(),
    error: Type.Optional(Type.String()),
});

const EvaluationErrorSchema = Type.Object({
    evaluation_id: Type.Number(),
    type: Type.Literal("evaluation_error"),
    error: Type.String(),
});

const EvaluationResponseSchema = Type.Union([
    SuccessfulEvaluationSchema,
    FileUnavailableSchema,
    EvaluationErrorSchema,
]);

export const CompiledSuccessfulEvaluationSchema = TypeCompiler.Compile(SuccessfulEvaluationSchema);
const CompiledEvaluationResponseSchema = TypeCompiler.Compile(EvaluationResponseSchema);

export type SuccessfulEvaluationRS = Static<typeof SuccessfulEvaluationSchema>;
type FileUnavailableResponse = Static<typeof FileUnavailableSchema>;
type EvaluationResponse = Static<typeof EvaluationResponseSchema>;

const convertSuccessfulEvaluationToEvaluationResult = (
    evaluation: SuccessfulEvaluationRS,
    testcases: EvaluationInputTestcase[]
): EvaluationResult[] => {
    if (evaluation.verdict.type === "compilation_error")
        return testcases.map((testcase) => ({
            testCaseId: testcase.id.toString(),
            type: "error",
            verdict: "compilation_error",
            error: evaluation.verdict.data ?? "",
            compiler_output: evaluation.compiler_output ?? undefined,
        }));

    return evaluation.testcases.map((testcase) => {
        switch (testcase.verdict.type) {
            case "accepted":
            case "wrong_answer":
            case "time_limit_exceeded":
            case "memory_limit_exceeded":
                return {
                    testCaseId: testcase.id,
                    type: "success",
                    verdict: testcase.verdict.type,
                    time: testcase.time,
                    memory: testcase.memory / 1024,
                    output: testcase.output ?? undefined,
                    compiler_output: evaluation.compiler_output ?? undefined,
                } satisfies EvaluationResult;
            case "custom":
                return {
                    testCaseId: testcase.id,
                    type: "success",
                    verdict: "custom",
                    time: testcase.time,
                    memory: testcase.memory / 1024,
                    extra: testcase.verdict.data ?? "",
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            case "compilation_error":
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "compilation_error",
                    error: testcase.error ?? "",
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            case "runtime_error":
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "runtime_error",
                    error: testcase.error ?? "",
                    exitCode: 1,
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            case "skipped":
                return { testCaseId: testcase.id, type: "skipped", verdict: "skipped" };
            case "evaluation_error":
            default:
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "evaluation_error",
                };
        }
    }) satisfies EvaluationResult[];
};

type PendingEvaluation = {
    resolve: (response: SuccessfulEvaluationRS) => void;
    reject: (error: Error) => void;
    origins: Map<string, EvaluationFileOrigin>;
    objectNames: Set<string>;
    timer: ReturnType<typeof setTimeout>;
};

const PendingEvaluations = new Map<number, PendingEvaluation>();

const cleanupObjects = async (objectNames: Set<string>) => {
    if (objectNames.size === 0) return;

    try {
        const store = await getEvaluationObjectStore();

        await Promise.all(
            [...objectNames].map(async (name) => {
                try {
                    await store.delete(name);
                } catch (error) {
                    Logger.error(`Failed cleaning evaluator object ${name}`, String(error));
                }
            })
        );
    } catch (error) {
        Logger.error("Failed opening evaluator object store during cleanup", String(error));
    }
};

const finishPending = async (
    evaluationId: number,
    finish: (pending: PendingEvaluation) => void
) => {
    const pending = PendingEvaluations.get(evaluationId);

    if (!pending) return false;

    PendingEvaluations.delete(evaluationId);
    clearTimeout(pending.timer);
    await cleanupObjects(pending.objectNames);
    finish(pending);

    return true;
};

const restoreUnavailableFile = async (
    response: FileUnavailableResponse,
    pending: PendingEvaluation
) => {
    if (response.bucket !== EVALUATION_OBJECT_BUCKET)
        throw new Error(`worker requested unknown object bucket ${response.bucket}`);

    const origin = pending.origins.get(response.name);

    if (!origin) throw new Error(`worker requested unknown evaluation object ${response.name}`);

    await putEvaluationObject(response.name, await readS3Object(origin.bucket, origin.key));
};

export const handleEvaluatorResponse = async (message: JsMsg) => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(new TextDecoder().decode(message.data));
    } catch (error) {
        Logger.error("Failed parsing NATS evaluator response", String(error));
        message.term("invalid JSON response");

        return;
    }

    if (!CompiledEvaluationResponseSchema.Check(parsed)) {
        Logger.error(
            "Failed validating NATS evaluator response: " +
                [...CompiledEvaluationResponseSchema.Errors(parsed)]
                    .map((error) => `${error.path}: ${error.message}`)
                    .join(", ")
        );
        message.term("invalid evaluator response schema");

        return;
    }

    const response = parsed as EvaluationResponse;
    const pending = PendingEvaluations.get(response.evaluation_id);

    if (!pending) {
        Logger.info(`Ignoring completed or unknown evaluation ${response.evaluation_id}`);
        message.ack();

        return;
    }

    try {
        if ("type" in response && response.type === "file_unavailable") {
            if (!response.retryable) {
                await finishPending(response.evaluation_id, (current) =>
                    current.reject(new AxiosError(response.error ?? "worker could not load file"))
                );
            } else {
                await restoreUnavailableFile(response, pending);
                Logger.info(
                    `Restored evaluator object ${response.name} after delivery ${response.request_delivery_count}`
                );
            }

            message.ack();

            return;
        }

        if ("type" in response && response.type === "evaluation_error") {
            await finishPending(response.evaluation_id, (current) =>
                current.reject(new AxiosError(response.error))
            );
            message.ack();

            return;
        }

        await finishPending(response.evaluation_id, (current) =>
            current.resolve(response as SuccessfulEvaluationRS)
        );
        message.ack();
    } catch (error) {
        Logger.error("Failed handling NATS evaluator response", String(error));
        message.nak(10_000);
    }
};

export const subscribeToEvaluatorResponseQueue = async () => {
    await initEvaluationNats(handleEvaluatorResponse);
    Logger.info("Subscribed to NATS evaluator responses");
};

const createEvaluationId = () => {
    let id: number;

    do id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    while (id === 0 || PendingEvaluations.has(id));

    return id;
};

export const evaluateTestcasesNew = async (
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">,
    evaluateAll: boolean = false
): Promise<AxiosEvaluationResponse> => {
    const evaluationId = createEvaluationId();
    let prepared: PreparedFiles;

    try {
        prepared = await prepareTestcases(evaluationId, testcases);
    } catch (error) {
        return [undefined, new AxiosError(`failed preparing evaluator files: ${String(error)}`)];
    }

    if (prepared.testcases.length === 0) {
        return [undefined, new AxiosError("evaluation requires at least one testcase")];
    }

    const payload = {
        BeginEvaluation: {
            schema_version: 1,
            response_subject: evaluationSubjects.responseForEvaluation(
                Globals.nats.evaluationInstanceId,
                evaluationId
            ),
            file_retry_limit: Globals.nats.fileRetryLimit,
            evaluation:
                problemDetails.evaluation_variant === "output-only"
                    ? generateOutputOnlyPayload(evaluationId, problemDetails, prepared.testcases[0])
                    : problemDetails.evaluation_variant === "interactive"
                    ? generateInteractivePayload(
                          evaluationId,
                          problemDetails,
                          prepared.testcases,
                          problem,
                          evaluateAll
                      )
                    : generateBatchPayload(
                          evaluationId,
                          problemDetails,
                          prepared.testcases,
                          problem,
                          evaluateAll
                      ),
        },
    };

    const evaluationResponse = new Promise<SuccessfulEvaluationRS>((resolve, reject) => {
        const timer = setTimeout(() => {
            void finishPending(evaluationId, (pending) =>
                pending.reject(new AxiosError(`evaluation ${evaluationId} timed out`))
            );
        }, Globals.nats.responseTimeoutMillis);

        PendingEvaluations.set(evaluationId, {
            resolve,
            reject,
            origins: prepared.origins,
            objectNames: prepared.objectNames,
            timer,
        });
    });

    try {
        await publishEvaluationRequest(evaluationId, Buffer.from(JSON.stringify(payload)));
        Logger.info(`Published evaluation ${evaluationId} to NATS JetStream`);
    } catch (error) {
        await finishPending(evaluationId, (pending) => pending.reject(error as Error));
    }

    try {
        const response = await evaluationResponse;

        return [convertSuccessfulEvaluationToEvaluationResult(response, testcases), undefined];
    } catch (error) {
        return [undefined, error instanceof AxiosError ? error : new AxiosError(String(error))];
    }
};
