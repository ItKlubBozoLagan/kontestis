import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractProblem } from "./extractProblem";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractGenerator = async (
    req: Request,
    generatorId: Snowflake = extractIdFromParameters(req, "generator_id")
) =>
    memoizedRequestExtractor(req, `__generator_${generatorId}`, async () => {
        const generator = await Database.selectOneFrom("generators", "*", {
            id: generatorId,
        });

        if (!generator) {
            throw new SafeError(StatusCodes.NOT_FOUND, "Generator not found");
        }

        if (generator.problem_id) {
            await extractProblem(req, generator.problem_id);
        }

        return generator;
    });
