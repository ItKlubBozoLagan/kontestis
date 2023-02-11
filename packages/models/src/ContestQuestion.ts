import { Snowflake } from "./Snowflake";

export type ContestQuestionV1 = {
    id: Snowflake;
    contest_member_id: Snowflake;
    contest_id: Snowflake;
    question: string;
    response_author_id: Snowflake;
    response: string;
};

export type ContestQuestion = ContestQuestionV1;
