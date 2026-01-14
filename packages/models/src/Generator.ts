import { EvaluationLanguage } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type GeneratorV1 = {
    id: Snowflake;
    user_id?: Snowflake;
    organisation_id?: Snowflake;
    contest_id?: Snowflake;
    problem_id?: Snowflake;
    name: string;
    code: string;
    language: EvaluationLanguage;
};

export type Generator = GeneratorV1;
