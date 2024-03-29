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

// Around 8MB
const TESTCASE_MAX_SIZE = 1 << 23;

const TestcaseSchema = Type.Object({
    input: Type.String({ maxLength: TESTCASE_MAX_SIZE }),
});

TestcaseHandler.post("/", useValidation(TestcaseSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const testcase: Testcase = {
        id: generateSnowflake(),
        cluster_id: cluster.id,
        input: req.body.input,
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

TestcaseHandler.patch("/:testcase_id", useValidation(TestcaseSchema), async (req, res) => {
    const testcase = await extractModifiableTestcase(req);

    await Database.update(
        "testcases",
        {
            input: req.body.input,
        },
        { id: testcase.id }
    );

    return respond(res, StatusCodes.OK);
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
