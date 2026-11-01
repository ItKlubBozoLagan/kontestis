import type { ContestQuestion } from "@kontestis/models";

/** A thread needs a reply when the last message is from the participant who opened it. */
export const needsReply = (thread: ContestQuestion) =>
    !thread.last_message_member_id || thread.last_message_member_id === thread.contest_member_id;
