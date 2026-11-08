import { Generator } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { extractGenerator } from "../../../extractors/extractGenerator";
import { extractModifiableGenerator } from "../../../extractors/extractModifiableGenerator";
import { extractModifiableProblem } from "../../../extractors/extractModifiableProblem";
import { extractProblem } from "../../../extractors/extractProblem";
import { extractUser } from "../../../extractors/extractUser";
import { generateSnowflake } from "../../../lib/snowflake";
import { useValidation } from "../../../middlewares/useValidation";
import { Repositories } from "../../../repositories/Repositories";
import { EvaluationLanguageSchema } from "../../../utils/evaluation.schema";
import { R } from "../../../utils/remeda";
import { respond } from "../../../utils/response";

const GeneratorHandler = Router({ mergeParams: true });

const GeneratorSchema = Type.Object({
    name: Type.String({ minLength: 1, maxLength: 255 }),
    code: Type.String({ minLength: 1 }),
    language: EvaluationLanguageSchema,
});

GeneratorHandler.get("/", async (req, res) => {
    const problem = await extractProblem(req);

    const generators = await Repositories.generators.select("*", {
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

    await Repositories.generators.insert(generator);

    return respond(res, StatusCodes.OK, generator);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
GeneratorHandler.get("/:generator_id", async (req, res) => {
    const generator = await extractGenerator(req);

    return respond(res, StatusCodes.OK, generator);
});

GeneratorHandler.patch("/:generator_id", useValidation(GeneratorSchema), async (req, res) => {
    const generator = await extractModifiableGenerator(req);

    await Repositories.generators.update(
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

    await Repositories.generators.delete("*", { id: generator.id });

    const testcases = await Repositories.testcases.select(["id"], { generator_id: generator.id });

    // Update any testcases that use this generator
    for (const chunk of R.chunk(testcases, 20)) {
        await Repositories.transaction(async (repositories) => {
            for (const testcase of chunk) {
                await repositories.testcases.update(
                    {
                        status: "generator-error",
                        error: "Generator deleted",
                        generator_id: null,
                    },
                    { id: testcase.id }
                );
            }
        });
    }

    return respond(res, StatusCodes.OK);
});

export default GeneratorHandler;
