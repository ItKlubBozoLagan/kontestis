import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { json } from "express";
import Express from "express";

import { generateCheckerFunction } from "./checkers/SimpleChecker";
import { evaluateInteractive } from "./evaluators/InteractiveEvaluator";
import { evaluateChecker } from "./evaluators/SimpleCheckerEvaluator";
import { recordOutputWithMemory } from "./recorders/RecordOutputWithMemory";
import { recordSimpleOutput } from "./recorders/SimpleOutputRecorder";
import { compileCode } from "./runners/GenericRunner";
import { runPython } from "./runners/PythonRunner";

const app = Express();

const EvaluationLanguageSchema = Type.Union([
    Type.Literal("python"),
    Type.Literal("c"),
    Type.Literal("cpp"),
    Type.Literal("java"),
    Type.Literal("go"),
    Type.Literal("rust"),
    // eslint-disable-next-line sonarjs/no-duplicate-string
    Type.Literal("output-only"),
]);
const TypeSchema = Type.Union([
    Type.Literal("plain"),
    Type.Literal("checker"),
    Type.Literal("interactive"),
    Type.Literal("output-only"),
]);

const EvaluationSchema = Type.Object({
    problem_type: TypeSchema,
    language: EvaluationLanguageSchema,
    code: Type.String(),
    time_limit: Type.Number(),
    memory_limit: Type.Number(),
    testcases: Type.Array(
        Type.Object({
            id: Type.String(),
            in: Type.String(),
            out: Type.String(),
        })
    ),
    evaluator: Type.Optional(Type.String()),
    evaluator_language: Type.Optional(EvaluationLanguageSchema),
});

const schemaCompiled = TypeCompiler.Compile(EvaluationSchema);

const PLAIN_TEXT_EVALUATOR = `
def read_until(separator):
    out = ""
    while True:
        line = input()
        if line == separator:
            return out
        out += " " + line.strip()

while True:
    separator = input()
    if len(separator.strip()) > 0:
        break

read_until(separator)
out = read_until(separator)
subOut = read_until(separator)

print("AC" if out.strip() == subOut.strip() else "WA")
`;

const plainTextEvaluatorBase64 = Buffer.from(PLAIN_TEXT_EVALUATOR, "utf8").toString("base64");

app.use(json({ limit: "50mb" }), (req, _, next) => {
    // json from express@5 yields undefined for empty bodies,
    //  this breaks validation, so we're falling back to an empty object
    if (req.body === undefined) req.body = {};

    next();
});

// eslint-disable-next-line sonarjs/cognitive-complexity
app.post("/", async (req, res) => {
    if (!schemaCompiled.Check(req.body)) return res.status(400).end();

    const submission: Static<typeof EvaluationSchema> = req.body;

    const compiledSubmission =
        req.body.problem_type !== "output-only"
            ? await compileCode(submission.code, submission.language)
            : undefined;

    if (compiledSubmission && compiledSubmission.type !== "success") {
        return res.status(200).send(
            submission.testcases.map((testcase) => ({
                testCaseId: testcase.id,
                type: "error",
                verdict: "compilation_error",
                error: compiledSubmission.error,
            }))
        );
    }

    const compiledEvaluator = await (() => {
        if (!submission.evaluator || !submission.evaluator_language) return;

        return compileCode(submission.evaluator, submission.evaluator_language);
    })();

    if (req.body.problem_type === "interactive") {
        if (!compiledEvaluator) return res.status(400);

        if (compiledEvaluator.type !== "success") {
            return res.status(200).send(
                submission.testcases.map((testcase) => ({
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "evaluation_error",
                }))
            );
        }

        return res
            .status(200)
            .json(
                await evaluateInteractive(
                    compiledSubmission!.runner,
                    compiledEvaluator.runner,
                    submission.testcases,
                    submission.time_limit,
                    submission.memory_limit
                )
            );
    }

    if (compiledEvaluator && compiledEvaluator.type !== "success") {
        return res.status(200).send(
            submission.testcases.map((testcase) => ({
                testCaseId: testcase.id,
                type: "error",
                verdict: "evaluation_error",
            }))
        );
    }

    return res.status(200).json(
        await evaluateChecker(
            compiledSubmission
                ? async (buffer) =>
                      recordOutputWithMemory(
                          await compiledSubmission.runner(),
                          buffer,
                          recordSimpleOutput
                      )
                : async () => {
                      return {
                          success: true,
                          output: Buffer.from(submission.code, "base64"),
                          timeMills: 0,
                          memory_usage_megabytes: 0,
                      };
                  },
            submission.testcases,
            generateCheckerFunction(
                req.body.problem_type === "plain" || !compiledEvaluator
                    ? () => runPython(Buffer.from(plainTextEvaluatorBase64, "base64"))
                    : compiledEvaluator.runner
            ),
            submission.time_limit,
            submission.memory_limit
        )
    );
});

const _PORT = process.env.PORT || 8080;

app.listen(_PORT, () => console.log("Listening on " + _PORT));
