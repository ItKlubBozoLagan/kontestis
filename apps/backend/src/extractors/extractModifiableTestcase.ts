import { Snowflake } from "@kontestis/models";
import { Request } from "express";

import { extractModifiableCluster } from "./extractModifiableCluster";
import { extractTestcase } from "./extractTestcase";

export const extractModifiableTestcase = async (
    req: Request,
    optionalTestcaseId?: Snowflake
) => {
    const testcase = await extractTestcase(req, optionalTestcaseId);

    await extractModifiableCluster(req, testcase.cluster_id);

    return testcase;
};
