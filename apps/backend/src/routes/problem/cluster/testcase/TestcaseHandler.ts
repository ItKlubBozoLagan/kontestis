import { Testcase } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../../../database/Database";
import { SafeError } from "../../../../errors/SafeError";
import { extractCluster } from "../../../../extractors/extractCluster";
import { extractModifiableCluster } from "../../../../extractors/extractModifiableCluster";
import { extractModifiableTestcase } from "../../../../extractors/extractModifiableTestcase";
import { extractProblem } from "../../../../extractors/extractProblem";
import { extractTestcase } from "../../../../extractors/extractTestcase";
import { Globals } from "../../../../globals";
import { generateSnowflake } from "../../../../lib/snowflake";
import { useValidation } from "../../../../middlewares/useValidation";
import { S3Client } from "../../../../s3/S3";
import { respond } from "../../../../utils/response";

const TestcaseHandler = Router({ mergeParams: true });

const TestcaseGeneratorSchema = Type.Object({
    input_type: Type.Literal("generator"),
    output_type: Type.Union([Type.Literal("auto"), Type.Literal("manual")]),
    generator_id: Type.String(),
    generator_input: Type.String({
        maxLength: 1 << 10,
    }),
});

TestcaseHandler.post(
    "/with-generator",
    useValidation(TestcaseGeneratorSchema),
    async (req, res) => {
        const cluster = await extractModifiableCluster(req);

        const testcase: Testcase = {
            id: generateSnowflake(),
            status: "not-ready",
            cluster_id: cluster.id,
            input_type: "generator",
            output_type: req.body.output_type,
            generator_id: BigInt(req.body.generator_id),
            generator_input: req.body.generator_input,
        };

        await Database.insertInto("testcases", testcase);

        return respond(res, StatusCodes.OK, testcase);
    }
);

TestcaseHandler.post("/", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const testcase: Testcase = {
        id: generateSnowflake(),
        status: "not-ready",
        cluster_id: cluster.id,
        input_type: "manual",
        output_type: "manual",
    };

    await Database.insertInto("testcases", testcase);

    return respond(res, StatusCodes.OK, testcase);
});

TestcaseHandler.get("/", async (req, res) => {
    const cluster = await extractCluster(req);

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    return respond(res, StatusCodes.OK, testcases);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
TestcaseHandler.get("/:testcase_id", async (req, res) => {
    const testcase = await extractTestcase(req);

    return respond(res, StatusCodes.OK, testcase);
});

// Accept file upload for input, use express file upload
TestcaseHandler.post("/:testcase_id/:type", async (req, res) => {
    const testcase = await extractModifiableTestcase(req);
    const problem = await extractProblem(req);

    if (!req.files?.input) {
        throw new SafeError(StatusCodes.BAD_REQUEST, "No input file provided");
    }

    if (req.params.type !== "input" && req.params.type !== "output") {
        throw new SafeError(StatusCodes.BAD_REQUEST, "Invalid type");
    }

    if (req.params.type === "output" && testcase.output_type !== "manual") {
        throw new SafeError(StatusCodes.BAD_REQUEST, "Testcase output is not manual");
    }

    if (req.params.type === "input" && testcase.input_type !== "manual") {
        throw new SafeError(StatusCodes.BAD_REQUEST, "Testcase input is not manual");
    }

    const inputFile = req.files.input;

    if (Array.isArray(inputFile)) {
        throw new SafeError(StatusCodes.BAD_REQUEST, "Got multiple files");
    }

    const filePath = `${problem.title}-${problem.id}/${testcase.id}-${generateSnowflake()}.${
        req.params.type === "input" ? "in" : "out"
    }`;

    await S3Client.putObject(Globals.s3.buckets.testcases, filePath, inputFile.data);

    await (req.params.type === "input"
        ? Database.update(
              "testcases",
              {
                  status: "not-ready",
                  input_file: filePath,
              },
              { id: testcase.id }
          )
        : Database.update(
              "testcases",
              {
                  status: "not-ready",
                  output_file: filePath,
              },
              { id: testcase.id }
          ));

    return respond(res, StatusCodes.OK, testcase);
});

TestcaseHandler.delete("/:testcase_id", async (req, res) => {
    const testcase = await extractModifiableTestcase(req);

    await Database.deleteFrom("testcases", "*", { id: testcase.id });
    await Database.deleteFrom("testcase_submissions", "*", {
        testcase_id: testcase.id,
    });

    return respond(res, StatusCodes.OK);
});

export default TestcaseHandler;
