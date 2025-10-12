import { Generator } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../../database/Database";
import { extractGenerator } from "../../../extractors/extractGenerator";
import { extractModifiableGenerator } from "../../../extractors/extractModifiableGenerator";
import { extractModifiableProblem } from "../../../extractors/extractModifiableProblem";
import { extractProblem } from "../../../extractors/extractProblem";
import { extractUser } from "../../../extractors/extractUser";
import { generateSnowflake } from "../../../lib/snowflake";
import { useValidation } from "../../../middlewares/useValidation";
import { EvaluationLanguageSchema } from "../../../utils/evaluation.schema";
import { respond } from "../../../utils/response";

const GeneratorHandler = Router({ mergeParams: true });

const GeneratorSchema = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 255 }),
    code: Type.String({ minLength: 1 }),
    language: EvaluationLanguageSchema,
});

GeneratorHandler.get("/", async (req, res) => {
    const problem = await extractProblem(req);

    const generators = await Database.selectFrom("generators", "*", {
        problem_id: problem.id,
    });

    return respond(res, StatusCodes.OK, generators);
});

GeneratorHandler.post("/", useValidation(GeneratorSchema), async (req, res) => {
    const problem = await extractModifiableProblem(req);
    const user = await extractUser(req);

    const generator: Generator = {
        id: generateSnowflake(),
        user_id: user.id,
        problem_id: problem.id,
        contest_id: problem.contest_id,
        name: req.body.name,
        code: req.body.code,
        language: req.body.language,
    };

    await Database.insertInto("generators", generator);

    return respond(res, StatusCodes.OK, generator);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
GeneratorHandler.get("/:generator_id", async (req, res) => {
    const generator = await extractGenerator(req);

    return respond(res, StatusCodes.OK, generator);
});

GeneratorHandler.patch("/:generator_id", useValidation(GeneratorSchema), async (req, res) => {
    const generator = await extractModifiableGenerator(req);

    await Database.update(
        "generators",
        {
            name: req.body.name,
            code: req.body.code,
            language: req.body.language,
        },
        { id: generator.id }
    );

    return respond(res, StatusCodes.OK);
});

GeneratorHandler.delete("/:generator_id", async (req, res) => {
    const generator = await extractModifiableGenerator(req);

    await Database.deleteFrom("generators", "*", { id: generator.id });

    // Update any testcases that use this generator
    await Database.update(
        "testcases",
        {
            status: "generator-error",
            error: "Generator deleted",
        },
        { generator_id: generator.id }
    );

    return respond(res, StatusCodes.OK);
});

export default GeneratorHandler;
