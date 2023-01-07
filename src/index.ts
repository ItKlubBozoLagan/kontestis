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


export enum Language {
    python = "python",
    c = "c",
    cpp = "cpp"
}

const schema = Type.Object({
    language: Type.Enum(Language),
    code: Type.String(),
    time_limit: Type.Number(),
    testcases: Type.Array(Type.Object({
        id: Type.Number(),
        in: Type.String(),
        out: Type.String()
    }))
});

const typeCheck = TypeCompiler.Compile(schema);

const plainTextEvaluator = "c2lkID0gaW50KGlucHV0KCkpCnRlc3RfaW4sIHRlc3Rfb3V0LCB1c2VyX291dCA9IGlucHV0KCkuc3BsaXQoZiI9PXtzaWR9PT0iKQpwcmludCgiQUMiIGlmIHRlc3Rfb3V0LnN0cmlwKCkgPT0gdXNlcl9vdXQuc3RyaXAoKSBlbHNlICJXQSIpCg==";

app.use(json());

app.post("/", async (req, res) => {
    if(!typeCheck.Check(req.body)) return res.status(400).send("Bad request!");

    const submission: Static<typeof schema> & { evaluator?: string } = req.body;
    if(submission.language === Language.cpp) {
        const compileResult = await transformToBinary(Buffer.from(submission.code, 'base64'));
        if(!compileResult.success) return res.status(200).send("Compilation error!");
        return res.status(200).json(
            await evaluateSimpleChecker(async (b) => recordOutputWithMemory(
                    await runBinary(compileResult.binary), b, recordSimpleOutput
                ), submission.testcases, getSimplePythonCheckerFunction(Buffer.from(submission.evaluator ?? plainTextEvaluator, 'base64'))
                , submission.time_limit)
        );
    }

    if(submission.language === Language.python) {
        return res.status(200).json(
            await evaluateSimpleChecker(async (b) => recordOutputWithMemory(
                    await runPython(Buffer.from(submission.code, 'base64')), b, recordSimpleOutput
                ), submission.testcases, getSimplePythonCheckerFunction(Buffer.from(submission.evaluator ?? plainTextEvaluator, 'base64'))
                , submission.time_limit)
        );
    }

    return res.status(200).send("Success!");
});

const _PORT = process.env.PORT || 8080;
app.listen(_PORT, () => console.log("Listening on " + _PORT));
