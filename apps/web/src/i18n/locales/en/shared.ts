export const ranks = {
    rookie: "Rookie",
    apprentice: "Apprentice",
    journeyman: "Journeyman",
    proficient: "Proficient",
    phenom: "Phenom",
    maestro: "Maestro",
    prodigy: "Prodigy",
};

export const verdicts = {
    accepted: "Accepted",
    wrong_answer: "Wrong answer",
    time_limit_exceeded: "Time limit exceeded",
    memory_limit_exceeded: "Memory limit exceeded",
    runtime_error: "Runtime error",
    compilation_error: "Compilation error",
    evaluation_error: "Evaluation error",
    system_error: "System error",
    skipped: "Skipped",
    custom: "Custom",
    pending: "Evaluating…",
};

export const phases = {
    upcoming: "Upcoming",
    running: "Running",
    finished: "Finished",
    startsIn: "Starts in {{time}}",
    endsIn: "Ends in {{time}}",
    endedAgo: "Finished",
};

export const programmingLanguages = {
    c: "C",
    cpp: "C++",
    python: "Python",
    java: "Java",
    go: "Go",
    rust: "Rust",
    gnu_asm_x86_linux: "x86 Assembly (GNU)",
    ocaml: "OCaml",
    "output-only": "Output only",
};

export const evaluationVariants = {
    plain: "Plain",
    checker: "Checker",
    interactive: "Interactive",
    "output-only": "Output only",
};

export const permissions = {
    title: "Permissions",
    description: "Choose what {{name}} is allowed to do.",
    admin: "Admin implies every other permission.",
    names: {
        ADMIN: "Admin",
        VIEW_USER: "View users",
        EDIT_USER: "Edit users",
        DELETE_USER: "Delete users",
        ADD_CONTEST: "Add contests",
        VIEW_CONTEST: "View contests",
        EDIT_CONTEST: "Edit contests",
        DELETE_CONTEST: "Delete contests",
        ADD_ALERTS: "Add alerts",
        EDIT_ALERTS: "Edit alerts",
        DELETE_ALERTS: "Delete alerts",
        VIEW_ORGANISATIONS: "View organisations",
        EDIT_ORGANISATIONS: "Edit organisations",
        DELETE_ORGANISATIONS: "Delete organisations",
        VIEW: "View",
        VIEW_PRIVATE: "View private data",
        EDIT: "Edit",
        ADD_USER: "Add participants",
        REMOVE_USER: "Remove participants",
        EDIT_USER_PERMISSIONS: "Edit participant permissions",
        VIEW_QUESTIONS: "View questions",
        ANSWER_QUESTIONS: "Answer questions",
        CREATE_ANNOUNCEMENT: "Create announcements",
    },
};

export const joinContest = {
    button: "Join contest",
    title: "Join a contest",
    description: "Enter the join code you received from the contest organiser.",
    code: "Join code",
    submit: "Join",
    invalid: "Invalid or expired join code",
    length: "Join codes are 16 characters long",
};

export const thread = {
    you: "You",
    staff: "Contest staff",
    unknown: "Unknown member",
    placeholder: "Write a message…",
    send: "Send",
    reply: "Reply",
    empty: "No messages yet.",
    hint: "Ctrl + Enter to send",
};

export const activity = {
    title: "Submissions",
    acceptedOnly: "Accepted only",
    total: "{{count}} submissions in the last year",
    day: "{{count}} submissions on {{date}}",
    less: "Less",
    more: "More",
};
