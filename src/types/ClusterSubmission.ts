import {Snowflake} from "../lib/snowflake";
import {Verdict} from "./Submission";


export type ClusterSubmission = {
    id: Snowflake,
    submission_id: Snowflake,
    cluster_id: Snowflake,

    verdict: Verdict,

    awardedScore: number,

}