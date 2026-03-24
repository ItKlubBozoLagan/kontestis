import { ContestChatMessageV1, ContestQuestionV1 } from "@kontestis/models";
import { Migration } from "scyllo";

import { generateSnowflake, getSnowflakeTime } from "../../lib/snowflake";

type MigrationType = {
    contest_chat_messages: ContestChatMessageV1;
    contest_questions: ContestQuestionV1 & {
        last_message_at?: Date;
        last_message_member_id?: bigint;
    };
};

export const migration_contest_chat_messages: Migration<MigrationType> = async (database, log) => {
    // Create chat messages table
    await database.createTable(
        "contest_chat_messages",
        true,
        {
            id: { type: "bigint" },
            thread_id: { type: "bigint" },
            contest_id: { type: "bigint" },
            author_member_id: { type: "bigint" },
            content: { type: "text" },
            created_at: { type: "timestamp" },
        },
        "id"
    );

    await database.createIndex(
        "contest_chat_messages",
        "contest_chat_messages_by_thread_id",
        "thread_id"
    );

    await database.createIndex(
        "contest_chat_messages",
        "contest_chat_messages_by_contest_id",
        "contest_id"
    );

    // Add new columns to contest_questions
    await database.raw("ALTER TABLE contest_questions ADD last_message_at timestamp");
    await database.raw("ALTER TABLE contest_questions ADD last_message_member_id bigint");

    // Migrate existing questions into chat messages
    const questions = await database.selectFrom("contest_questions", "*", {});

    for (const question of questions) {
        const questionTime = getSnowflakeTime(question.id);

        // Insert the question text as the first message
        await database.insertInto("contest_chat_messages", {
            id: question.id,
            thread_id: question.id,
            contest_id: question.contest_id,
            author_member_id: question.contest_member_id,
            content: question.question,
            created_at: questionTime,
        });

        let lastMessageAt = questionTime;
        let lastMessageMemberId = question.contest_member_id;

        // Insert the response as a second message if it exists
        if (question.response && question.response_author_id) {
            const responseTime = new Date(questionTime.getTime() + 1000);

            await database.insertInto("contest_chat_messages", {
                id: generateSnowflake(),
                thread_id: question.id,
                contest_id: question.contest_id,
                author_member_id: question.response_author_id,
                content: question.response,
                created_at: responseTime,
            });

            lastMessageAt = responseTime;
            lastMessageMemberId = question.response_author_id;
        }

        await database.update(
            "contest_questions",
            { last_message_at: lastMessageAt, last_message_member_id: lastMessageMemberId },
            { id: question.id }
        );
    }

    log(`Migrated ${questions.length} existing questions to chat messages`);
    log("Done");
};
