import { Snowflake } from "./Snowflake";

export type ContestQuestionV1 = {
    id: Snowflake;
    contest_member_id: Snowflake;
    contest_id: Snowflake;
    question: string;
    response_author_id?: Snowflake;
    response?: string;
};

export type ContestQuestionV2 = ContestQuestionV1 & {
    last_message_at?: Date;
    last_message_member_id?: Snowflake;
};

export type ContestQuestion = ContestQuestionV2;
