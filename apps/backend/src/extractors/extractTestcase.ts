import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractCluster } from "./extractCluster";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractTestcase = (
    req: Request,
    testcaseId: Snowflake = extractIdFromParameters(req, "testcase_id")
) =>
    memoizedRequestExtractor(req, "__testcase_" + testcaseId, async () => {
        const testcase = await Database.selectOneFrom("testcases", "*", {
            id: testcaseId,
        });

        if (!testcase) throw new SafeError(StatusCodes.NOT_FOUND);

        await extractCluster(req, testcase.cluster_id);

        return testcase;
    });
