import { LanguageSpec } from "../i18n";

const I18nEn = {
    backendErrors: {
        unavailable: {
            header: "Sorry",
            description: "We seem to be experiencing some problems right now.",
        },
        rateLimit: {
            header: "Slow down!",
            description: "You have been rate limited.",
        },
    },
    login: {
        label: "Log in",
        logout: "Log out",
        siteRestriction: "Login is currently only limited to %1 and %2 accounts",
    },
    navbar: {
        dashboard: "Dashboard",
        contests: "Contests",
        problems: "Problems",
        account: "Account",
        management: "Management",
        admin: "Admin",
        alerts: {
            noContentMessage: "You're up to date!",
            breadcrumbs: {
                official: "Official",
            },
            overflow: {
                expand: "Expand",
                collapse: "Collapse",
            },
        },
    },
    notifications: {
        "contest-start": "Contest %1 has started!",
        "contest-end": "Contest %1 has ended!",
        "new-question": "A new question has been posted in %1",
        "new-announcement": "There's a new announcement in %1",
        "question-answer": "Your question has been answered in %1",
        // must begin with a space, Translated component currently
        //  has a bug where it doesn't handle messages beginning with a placeholder
        alert: " %1",
    },
    contestJoin: {
        buttonText: "Join contest",
        submitText: "Join",
        inputTitle: "Code",
    },
    helper: {
        tableNoContents: "None so far",
        shortWeekDayNames: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        shortMonthNames: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
    },
    dashboard: {
        basicInfo: {
            title: "Basic information",
            contests: "Total Contests",
            problems: "Total Problems",
            submissions: "Total Submissions",
        },
        activity: {
            title: "Your activity",
        },
        alerts: {
            title: "Site alerts",
            none: "None so far!",
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
            loading: "Loading",
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
                    waiting: "Waiting for response!",
                    all: "Show older",
                    collapse: "Collapse",
                },
            },
        },
        management: {
            label: "Your contests",
            createButton: "Create new",
            modal: {
                label: "Contest information",
                createButton: "Create",
            },
            individual: {
                title: "Contest » %1",
                routes: {
                    overview: "Overview",
                    problems: "Problems",
                    announcements: "Announcements",
                    questions: "Questions",
                    participants: "Participants",
                    results: "Results",
                },
                overview: {
                    status: {
                        label: "Status",
                        pending: "Starts in",
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
                        title: "Statistics",
                        registeredParticipants: "Registered participants",
                        announcements: "Announcements",
                        unansweredQuestions: "Unanswered questions",
                    },
                    clone: {
                        title: "Copy",
                        cloneButton: "Clone",
                        inOrganisation: "to organisation",
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
                        evaluationVariant: {
                            label: "Evaluation variant",
                            plain: "Plain",
                            checker: "Checker",
                            outputOnly: "Output only",
                            checkers: {
                                standard: "Standardan",
                                interactive: "Interaktivni",
                            },
                        },
                        evaluationLanguage: "Evaluation language",
                        evaluationScript: "Evaluation script (optional)",
                        solutionLanguage: "Solution language",
                        solutionCode: "Solution code",
                        createButton: "Create",
                    },
                    individual: {
                        info: {
                            label: "Info",
                            name: "Name",
                            description: "Description",
                            timeLimit: "Time limit",
                            memoryLimit: "Memory limit",
                            evaluationVariant: {
                                label: "Evaluation variant",
                                plain: "Plain",
                                checker: "Checker",
                                outputOnly: "Output only",
                                checkers: {
                                    standard: "Standard",
                                    interactive: "Interactive",
                                },
                            },
                            evaluationScript: "Evaluation script",
                            evaluationScriptLanguage: "Evaluation script language",
                            solutionLanguage: "Solution language",
                            solutionCode: "Solution code",
                            tags: "Tags",
                            score: "Score",
                            empty: "None",
                        },
                    },
                    cluster: {
                        createButton: "Create cluster",
                        info: {
                            title: "Info",
                            score: "Score",
                            generator: {
                                label: "Generator",
                                plain: "Plain",
                                generator: "Generator",
                                status: {
                                    title: "Status",
                                    cached: "Ready (cached)",
                                    uncached: "Ready (uncached)",
                                    errors: {
                                        generator: "Generator error",
                                        solution: "Solution error",
                                    },
                                    pending: "Pending",
                                },
                                dropCache: "Drop cache",
                                generate: "Generate",
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
                                clusterIndex: "Cluster %1",
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
                    permissions: {
                        editButton: "Edit permissions",
                        modal: {
                            title: "Permissions",
                            saveButton: "Save",
                        },
                    },
                },
                results: {
                    gradingScale: {
                        title: "Grading scale",
                        createButton: "Create grading scale",
                        listItem: {
                            grade: "Grade",
                            percentage: "Percentage",
                        },
                    },
                    createModal: {
                        title: "Create grading scale for %1",
                        percentage: "Percentage",
                        grade: "Grade",
                        createButton: "Create",
                    },
                    table: {
                        head: {
                            user: "User",
                            points: "Points",
                            reviewed: "Reviewed",
                            exports: "Exports",
                        },
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
                tags: "Tags",
            },
            body: {
                noTags: "None",
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
                final: "Final",
                notFinal: "Set final",
                notExam: "Not submitted",
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
        stats: {
            submissions: {
                title: "Submissions",
                toggles: {
                    showAccepted: "show accepted",
                    showRandom: "random data",
                },
                total: "Total",
                hover: {
                    oneSubmission: "Submission on",
                    fewSubmissions: "Submissions on",
                    moreSubmissions: "Submissions on",
                },
            },
            elo: {
                title: "Elo",
            },
        },
    },
    organisations: {
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
        management: {
            backButton: "Back",
            title: "Organisation » %1",
            info: {
                title: "Info",
                name: "Name",
            },
            members: {
                add: {
                    label: "Add member",
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
    admin: {
        title: "Administration area",
        routes: {
            overview: "Overview",
            users: "Users",
            alerts: "Site alerts",
            contests: "Contests",
            organizations: "Organisations",
            mail: "Mail",
        },
        overview: {
            charts: {
                activityLabel: "Activity",
                loginLabel: "Logins",
                loginToggleNewUsers: "new users",
                loginToggleUnique: "unique",
            },
            metrics: {
                rawSystem: {
                    title: "Server",
                    memory: "Memory",
                    hostname: "Hostname",
                    operatingSystem: "Operating system",
                },
                kubernetes: {
                    memory: "Memory",
                    datasets: {
                        kontestis: "Kontestis",
                        cluster: "Cluster",
                    },
                    nodes: {
                        title: "Nodes",
                        stats: {
                            memory: "Memory",
                        },
                    },
                    pods: {
                        title: "Application scale",
                        label: "Pods",
                    },
                },
            },
            alerts: {
                label: "Alert",
                pushButton: "Push",
            },
            contests: {
                message: "Admins can manage contests in menagement page",
                goToMangement: "Got to management",
            },
        },
        users: {
            title: "Users",
            editPermission: "Edit permissions",
        },
    },
    permissions: {
        contest_member: {
            ADMIN: "Admin",
            VIEW_PRIVATE: "View (admin)",
            ADD_USER: "Add user",
            EDIT_USER_PERMISSIONS: "Edit user permissions",
            ANSWER_QUESTIONS: "Answer questions",
            VIEW: "View",
            EDIT: "Edit",
            REMOVE_USER: "Remove user",
            VIEW_QUESTIONS: "View questions",
            CREATE_ANNOUNCEMENT: "Create announcements",
        },
        admin: {
            ADMIN: "Admin",
            VIEW_USER: "View user",
            EDIT_USER: "Edit user",
            DELETE_USER: "Delete user",
            ADD_CONTEST: "Add contest",
            VIEW_CONTEST: "View contest",
            EDIT_CONTEST: "Edit contest",
            DELETE_CONTEST: "Delete contest",
            ADD_ALERTS: "Add alerts",
            EDIT_ALERTS: "Edit alerts",
            DELETE_ALERTS: "Delete alerts",
            VIEW_ORGANISATIONS: "View organisations",
            EDIT_ORGANISATIONS: "Edit organisations",
            DELETE_ORGANISATIONS: "Delete organisations",
        },
        organisation_member: {
            ADMIN: "Admin",
            VIEW: "View",
            VIEW_USER: "View user",
            EDIT_USER: "Edit user",
            DELETE_USER: "Delete user",
            ADD_CONTEST: "Add contest",
            VIEW_CONTEST: "View contest",
            EDIT_CONTEST: "Edit contest",
            DELETE_CONTEST: "Delete contest",
            ADD_ALERTS: "Add alerts",
            EDIT_ALERTS: "Edit alerts",
            DELETE_ALERTS: "Delete alerts",
        },
    },
    errorMessages: {
        invalid: "Validation error! Check your input!",
        withInfo: "Error! %1",
    },
} as const satisfies LanguageSpec;

export default I18nEn;

export type I18nEn_Type = typeof I18nEn;
