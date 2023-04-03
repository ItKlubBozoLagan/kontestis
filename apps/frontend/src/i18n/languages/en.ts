import { LanguageSpec } from "../i18n";

const I18nEn = {
    login: {
        siteRestriction: "Login is currently only limited to %1 accounts",
    },
    navbar: {
        dashboard: "Dashboard",
        contests: "Contests",
        problems: "Problems",
        account: "Account",
        management: "Management",
    },
    dashboard: {
        total: {
            contests: "Total Contests",
            problems: "Total Problems",
            submissions: "Total Submissions",
        },
    },
    contests: {
        page: {
            exams: "Exams",
            official: "Contests",
            unofficial: "Unofficial contests",
            table: {
                head: {
                    name: "Name",
                    startTime: "Start time",
                    starts: {
                        label: "Starts",
                    },
                    duration: "Duration",
                    partaking: "Partaking",
                },
                body: {
                    starts: {
                        finished: "Finished",
                        started: "Started",
                    },
                },
            },
        },
        individual: {
            problems_table: {
                problem: "Problem",
                examProblem: "Task",
                score: "Score",
            },
            leaderboard: {
                running: "Live leaderboard",
                finished: "Final standings",
                table: {
                    contestant: "Contestant",
                },
            },
            announcements: {
                label: "Announcements",
            },
            questions: {
                label: "Questions",
                ask: "Ask a question:",
                sendButton: "Send",
            },
        },
        management: {
            label: "Your contests",
            individual: {
                overview: {
                    label: "Overview",
                    status: {
                        label: "Status",
                        pending: "Starts in %1",
                        running: "Running: %1",
                        finished: "Finished",
                    },
                    info: {
                        label: "Contest information",
                        name: "Name",
                        startTime: "Start time",
                        duration: "Duration",
                        visibility: {
                            label: "Visibility",
                            private: "Private",
                            public: "Public",
                        },
                        scoring: {
                            label: "Scoring",
                            official: "Official",
                            unofficial: "Unofficial",
                        },
                        style: {
                            label: "Style",
                            contest: "Contest",
                            exam: "Exam",
                        },
                        errorMessage: {
                            invalid: "Validation error! Check your input",
                        },
                        createButton: "Create",
                    },
                    statistics: {
                        label: "Statistics",
                        registeredParticipants: "Registered participants",
                        announcements: "Announcements",
                        unansweredQuestions: "Unanswered questions",
                    },
                },
                problems: {
                    createButton: "Create new",
                    table: {
                        head: {
                            name: "Name",
                            score: "Score",
                            users: "Users",
                            solves: "Solves",
                        },
                    },
                    individual: {
                        info: {
                            label: "Info",
                            name: "Name",
                            description: "Description",
                            timeLimit: "Time limit",
                            memoryLimit: "Memory limit",
                            evaluationScript: "Evaluation script",
                            score: "Score",
                        },
                    },
                    cluster: {
                        createButton: "Create cluster",
                        table: {
                            head: {
                                cluster: "Cluster",
                                awardedScore: "Awarded score",
                            },
                        },
                    },
                    submissions: {
                        empty: "No submissions yet :(",
                        table: {
                            head: {
                                user: "User",
                                verdict: "Verdict",
                                time: "Time",
                                memory: "Memory",
                                language: "Language",
                                points: "Points",
                            },
                        },
                    },
                },
                announcements: {
                    label: "Announcement:",
                    sendButton: "Send",
                },
                questions: {
                    empty: "None so far",
                    unAnswered: {
                        label: "Not answered",
                        answerButton: "Answer",
                    },
                    answered: {
                        label: "Answered",
                        answerButton: "Answer",
                    },
                },
                participants: {
                    addParticipant: {
                        label: "Add participant",
                        addButton: "Add",
                        placeholder: "example@skole.hr",
                        errorMessages: {
                            invalid: "Invalid email address",
                            double: "User doesn't exist or is already a participant",
                        },
                    },
                },
            },
        },
    },
    problems: {
        page: {
            title: "Problems",
            table: {
                head: {
                    name: "Name",
                    contestName: "Contest Name",
                    added: "Added",
                    score: "Score",
                },
            },
        },
    },
    account: {
        label: "Account information",
        fullName: "Full Name",
        email: "E-mail",
        breadcrumbs: {
            creator: "Creator",
            admin: "Admin",
        },
    },
} as const satisfies LanguageSpec;

export default I18nEn;

export type I18nEn_Type = typeof I18nEn;
