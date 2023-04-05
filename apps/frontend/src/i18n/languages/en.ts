import { LanguageSpec } from "../i18n";

const I18nEn = {
    login: {
        label: "Log in",
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
                registered: {
                    notRegistered: "Register",
                    registered: "Registered",
                },
            },
        },
        page: {
            exams: "Exams",
            official: "Contests",
            unofficial: "Unofficial contests",
            loading: "loading",
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
                    total: "Total",
                },
                emptyMessage: "Surprisingly empty here",
            },
            announcements: {
                label: "Announcements",
                empty: "No announcements yet.",
            },
            questions: {
                label: "Questions",
                ask: "Ask a question",
                sendButton: "Send",
                list: {
                    preMessage: "Waiting for response!",
                    all: "Show older",
                    collapse: "Collapse",
                },
            },
        },
        management: {
            label: "Your contests",
            createButton: "Create new",
            noContests: "None so far",
            modal: {
                label: "Contest information",
                createButton: "Create",
            },
            individual: {
                title: "Contest » %1",
                overview: {
                    label: "Overview",
                    status: {
                        label: "Status",
                        pending: "Starts in ",
                        running: "Running",
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
                    createModal: {
                        title: "Create problem for %1",
                        name: "Name",
                        statement: "Description",
                        timeLimit: "Time limit",
                        memoryLimit: "Memory limit",
                        evaluationScript: "Evaluation script (optional)",
                        solutionLanguage: "Solution language",
                        solutionCode: "Solution code",
                        createBottun: "Create",
                    },
                    individual: {
                        info: {
                            label: "Info",
                            name: "Name",
                            description: "Description",
                            timeLimit: "Time limit",
                            memoryLimit: "Memory limit",
                            evaluationScript: "Evaluation script (python)",
                            solutionLanguage: "Solution language",
                            solutionCode: "Solution code",
                            score: "Score",
                            empty: "None",
                        },
                    },
                    cluster: {
                        createButton: "Create cluster",
                        info: {
                            title: "info",
                            score: "Score",
                            generator: {
                                label: "Generator",
                                plain: "Plain",
                                generator: "Generator",
                            },
                            generator_language: "Generator language",
                            generator_code: "Generator code",
                        },
                        table: {
                            head: {
                                cluster: "Cluster",
                                awardedScore: "Awarded score",
                            },
                            body: {
                                cluserIndex: "Cluster %1",
                            },
                        },
                        modal: {
                            title: "Create cluster for %1",
                            awardedScore: "Awarded score",
                            createButton: "Create",
                        },
                        testCase: {
                            input: "Input",
                            output: "Correct output",
                            info: "info",
                            createButton: "Create testcase",
                            table: {
                                head: {
                                    testCase: "Testcase",
                                },
                                body: {
                                    testCase: "Testcase %1",
                                },
                            },
                            modal: {
                                CreateButton: "Create",
                            },
                        },
                    },
                },
                announcements: {
                    label: "Announcement",
                    sendButton: "Send",
                },
                questions: {
                    empty: "None so far",
                    answerButton: "Answer",
                    unAnswered: {
                        label: "Not answered",
                    },
                    answered: {
                        label: "Answered",
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
                    remove: {
                        proposeRemoval: "Remove",
                        confirm: "Confirm",
                    },
                },
            },
        },
    },
    problems: {
        table: {
            head: {
                name: "Name",
                contestName: "Contest Name",
                added: "Added",
                score: "Score",
            },
        },
        page: {
            title: "Problems",
        },
        individual: {
            loading: "Loading...",
            limits: {
                title: "Limits",
                time: "Time",
                memory: "Memory",
                sourceSize: "Source size",
                points: "Points",
            },
            submit: {
                title: "Submit",
                code: "Code",
                submitButton: "Submit",
            },
        },
    },
    submissions: {
        empty: "No submissions yet :(",
        loading: "Loading submissions...",
        processing: "Processing...",
        table: {
            head: {
                user: "User",
                verdict: "Verdict",
                time: "Time",
                memory: "Memory",
                language: "Language",
                points: "Points",
                final: "Final",
                cluster: "Cluster",
                testcase: "Testcase",
            },
            body: {
                final: "final",
                notFinal: "Set final",
                notExam: "Ignored",
                pointsAchieved: " %1 points",
                clusterIndex: "Cluster %1",
                testcaseIndex: "Testcase %1",
            },
            overflow: {
                expand: "Expand",
                collapse: "Collapse",
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
            owner: "Owner",
        },
    },
    ogranisations: {
        page: {
            title: "Organisations",
            createButton: "Create Organisation",
            table: {
                name: "Name",
                details: "Details",
            },
            modal: {
                title: "Create new organisation",
                name: "Name",
                createButton: "Create",
            },
        },
        menagement: {
            backButton: "Back",
            title: "Organisation » %1",
            info: {
                title: "Info",
                name: "Name",
            },
            members: {
                add: {
                    label: "Add memeber",
                    addButton: "Add",
                    placeholder: "example@skole.hr",
                    errorMessages: {
                        invalid: "Invalid email address",
                        double: "User doesn't exist or is already a member",
                    },
                },
                remove: {
                    proposeRemoval: "Remove",
                    confirm: "Confirm",
                },
            },
        },
    },
    errorMessages: {
        invalid: "Validation error! Check your input!",
        withInfo: "Error! %1",
    },
} as const satisfies LanguageSpec;

export default I18nEn;

export type I18nEn_Type = typeof I18nEn;
