import { Generator, Snowflake } from "@kontestis/models";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { splitAndEvaluateTestcases } from "./evaluation";
import { Logger } from "./logger";

export type GeneratorInputData = {
    id: Snowflake;
    input: string;
};

export type GenerationOutput =
    | {
          id: Snowflake;
          type: "success";
          output: string;
      }
    | {
          id: Snowflake;
          type: "error";
          error: string;
      };

// TODO: move to somewhere else
export const IGNORE_OUTPUT_CHECKER = `
#include<iostream>

int main() {
  std::cout << "accepted" << std::endl;
  return 0;
}
`;

export const generateTestcases = async (
    generator: Generator,
    generatorInputs: GeneratorInputData[]
) => {
    const [rawOutData, error] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: generator.language ?? "python",
            // TODO: Fix the base64 encoding on other side
            code: Buffer.from(generator.code ?? "", "utf-8").toString("base64"),
            evaluator: IGNORE_OUTPUT_CHECKER,
            evaluation_variant: "checker",
            evaluator_language: "cpp",
            legacy_evaluation: false,
        },
        generatorInputs.map((generatorInput) => ({
            ...generatorInput,
            correct_output: "",
        })),
        {
            time_limit_millis: 30_000,
            memory_limit_megabytes: 2048,
        }
    );

    if (!rawOutData) {
        Logger.error(`Generation error on ${generator.name}: ${error}`);
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const generationOutput: GenerationOutput[] = [];

    for (const result of rawOutData) {
        if (result.type !== "success") {
            generationOutput.push({
                id: BigInt(result.testCaseId),
                type: "error",
                error: result.verdict === "compilation_error" ? result.error : "Runtime error",
            });
            continue;
        }

        if (result.verdict !== "accepted") {
            generationOutput.push({
                id: BigInt(result.testCaseId),
                type: "error",
                error: result.verdict,
            });
            continue;
        }

        if (result.output === undefined) {
            Logger.info(`Empty result on ${generator.name}: ${result}`);
        }

        generationOutput.push({
            id: BigInt(result.testCaseId),
            type: "success",
            output: result.output ?? "",
        });
    }

    return generationOutput;
};
