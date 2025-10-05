import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../../../errors/SafeError";
import { extractTestcase } from "../../../../extractors/extractTestcase";
import { Globals } from "../../../../globals";
import { respond } from "../../../../utils/response";
import { s3OfflinePresignGetObject } from "../../../../utils/s3";

const TestcaseFileHandler = Router({ mergeParams: true });

TestcaseFileHandler.get("/:type", async (req, res) => {
    const { type } = req.params;

    if (type !== "input" && type !== "output")
        throw new SafeError(StatusCodes.BAD_REQUEST, "Invalid type");

    const testcase = await extractTestcase(req);

    const fileField = type === "input" ? testcase.input_file : testcase.output_file;

    if (!fileField) {
        throw new SafeError(StatusCodes.NOT_FOUND, `${type} file not found`);
    }

    const fileUrl = await s3OfflinePresignGetObject(
        Globals.s3.buckets.testcases,
        fileField,
        10 * 60,
        {
            "response-content-disposition": `attachment;filename="testcase-${testcase.id}.${type}"`,
            "response-content-type": "application/octet-stream",
        }
    );

    respond(res, StatusCodes.OK, {
        url: fileUrl,
    });
});

export default TestcaseFileHandler;
