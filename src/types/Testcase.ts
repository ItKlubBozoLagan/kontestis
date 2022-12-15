import {Snowflake} from "../lib/snowflake";


export type Testcase = {
    id: Snowflake,
    cluster_id: Snowflake,
    input: string,
    correctOutput?: string
}