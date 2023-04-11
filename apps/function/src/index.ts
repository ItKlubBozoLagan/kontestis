import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { json } from "express";
import Express from "express";

import { getSimplePythonCheckerFunction } from "./checkers/SimpleChecker";
import { evaluateSimpleChecker } from "./evaluators/SimpleCheckerEvaluator";
import { recordOutputWithMemory } from "./recorders/RecordOutputWithMemory";
import { recordSimpleOutput } from "./recorders/SimpleOutputRecorder";
import { getRunnerFunction } from "./runners/GenericRunner";

const app = Express();

const LanguageSchema = Type.Union([Type.Literal("python"), Type.Literal("c"), Type.Literal("cpp")]);

const schema = Type.Object({
    language: LanguageSchema,
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
});

const typeCheck = TypeCompiler.Compile(schema);

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

app.post("/", async (req, res) => {
    if (!typeCheck.Check(req.body)) return res.status(400).end();

    const submission: Static<typeof schema> & { evaluator?: string } = req.body;

    const runnerFunction = await getRunnerFunction(submission.code, submission.language);

    if (runnerFunction.type !== "success") {
        return res.status(200).send(
            submission.testcases.map((testcase) => ({
                testCaseId: testcase.id,
                type: "error",
                verdict: "compilation_error",
                error: runnerFunction.error,
            }))
        );
    }

    return res
        .status(200)
        .json(
            await evaluateSimpleChecker(
                async (b) =>
                    recordOutputWithMemory(await runnerFunction.runner(), b, recordSimpleOutput),
                submission.testcases,
                getSimplePythonCheckerFunction(
                    Buffer.from(submission.evaluator ?? plainTextEvaluatorBase64, "base64")
                ),
                submission.time_limit,
                submission.memory_limit
            )
        );
});

const _PORT = process.env.PORT || 8080;

app.listen(_PORT, () => console.log("Listening on " + _PORT));
