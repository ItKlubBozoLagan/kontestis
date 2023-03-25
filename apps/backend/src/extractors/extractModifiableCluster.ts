import { Snowflake } from "@kontestis/models";
import { Request } from "express";

import { extractCluster } from "./extractCluster";
import { extractModifiableProblem } from "./extractModifiableProblem";

export const extractModifiableCluster = async (req: Request, clusterId?: Snowflake) => {
    const cluster = await extractCluster(req, clusterId);

    await extractModifiableProblem(req, cluster.problem_id);

    return cluster;
};
