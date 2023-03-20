import { Testcase } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../../../database/Database";
import { extractCluster } from "../../../../extractors/extractCluster";
import { extractModifiableCluster } from "../../../../extractors/extractModifiableCluster";
import { extractModifiableTestcase } from "../../../../extractors/extractModifiableTestcase";
import { extractTestcase } from "../../../../extractors/extractTestcase";
import { generateSnowflake } from "../../../../lib/snowflake";
import { useValidation } from "../../../../middlewares/useValidation";
import { respond } from "../../../../utils/response";

const TestcaseHandler = Router({ mergeParams: true });

const testcaseSchema = Type.Object({
    input: Type.String(),
    correctOutput: Type.String({ default: "" }),
});

TestcaseHandler.post("/", useValidation(testcaseSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const testcase: Testcase = {
        id: generateSnowflake(),
        cluster_id: cluster.id,
        input: req.body.input,
        correct_output: req.body.correctOutput,
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

TestcaseHandler.get("/:testcase_id", async (req, res) => {
    const testcase = await extractTestcase(req);

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
