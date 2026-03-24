import { Snowflake } from "./Snowflake";

export type ContestChatMessageV1 = {
    id: Snowflake;
    thread_id: Snowflake;
    contest_id: Snowflake;
    author_member_id: Snowflake;
    content: string;
    created_at: Date;
};

export type ContestChatMessage = ContestChatMessageV1;

export type ContestChatMessageWithAuthor = ContestChatMessage & {
    author_name?: string;
};
