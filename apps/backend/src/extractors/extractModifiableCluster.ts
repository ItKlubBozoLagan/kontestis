import { Snowflake } from "@kontestis/models";
import { Request } from "express";

import { extractCluster } from "./extractCluster";
import { extractModifiableProblem } from "./extractModifiableProblem";

export const extractModifiableCluster = async (req: Request, optionalClusterId?: Snowflake) => {
    const cluster = await extractCluster(req, optionalClusterId);

    await extractModifiableProblem(req, cluster.problem_id);

    return cluster;
};
