import {json} from "express";
import {Static, Type} from "@sinclair/typebox";
import {TypeCompiler} from "@sinclair/typebox/compiler";

import Express from "express";
import {evaluateSimpleChecker} from "./evaluators/SimpleCheckerEvaluator";
import {recordSimpleOutput} from "./recorders/SimpleOutputRecorder";
import {runBinary} from "./runners/BinaryRunner";
import {getSimplePythonCheckerFunction} from "./checkers/SimpleChecker";
import {transformToBinary} from "./transformers/CPPCompiledTransformer";
import {runPython} from "./runners/PythonRunner";
import {recordOutputWithMemory} from "./recorders/RecordOutputWithMemory";

const app = Express();


const LanguageSchema = Type.Union([
    Type.Literal("python"),
    Type.Literal("c"),
    Type.Literal("cpp")
]);

export type Language = Static<typeof LanguageSchema>;

const schema = Type.Object({
    language: LanguageSchema,
    code: Type.String(),
    time_limit: Type.Number(),
    testcases: Type.Array(Type.Object({
        id: Type.Number(),
        in: Type.String(),
        out: Type.String()
    }))
});

const typeCheck = TypeCompiler.Compile(schema);

const PLAIN_TEXT_EVALUATOR = `
sid = int(input())
test_in, test_out, user_out = input().split(f"=={sid}==")
print("AC" if test_out.strip() == user_out.strip() else "WA")
`

const plainTextEvaluatorBase64 = new Buffer(PLAIN_TEXT_EVALUATOR, "utf-8").toString("base64");

app.use(json());

app.post("/", async (req, res) => {
    if(!typeCheck.Check(req.body)) return res.status(400).send("Bad request!");

    const submission: Static<typeof schema> & { evaluator?: string } = req.body;
    if(submission.language === "cpp") {
        const compileResult = await transformToBinary(Buffer.from(submission.code, 'base64'));
        if(!compileResult.success) return res.status(200).send("Compilation error!");
        return res.status(200).json(
            await evaluateSimpleChecker(
                async (b) => recordOutputWithMemory(
                    await runBinary(compileResult.binary),
                    b,
                    recordSimpleOutput
                ),
                submission.testcases,
                getSimplePythonCheckerFunction(Buffer.from(submission.evaluator ?? plainTextEvaluatorBase64, 'base64')),
                submission.time_limit
            )
        );
    }

    if(submission.language === "python") {
        return res.status(200).json(
            await evaluateSimpleChecker(
                async (b) => recordOutputWithMemory(
                    await runPython(Buffer.from(submission.code, 'base64')),
                    b,
                    recordSimpleOutput
                ),
                submission.testcases, getSimplePythonCheckerFunction(Buffer.from(submission.evaluator ?? plainTextEvaluatorBase64, 'base64'))
                , submission.time_limit)
        );
    }

    return res.status(200).send("Success!");
});

const _PORT = process.env.PORT || 8080;
app.listen(_PORT, () => console.log("Listening on " + _PORT));
