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
    register: {
        label: "Register",
        fullName: "Full name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password",
        haveAccount: "Already have an account?",
    },
    navbar: {
        dashboard: "Dashboard",
        contests: "Contests",
        problems: "Problems",
        submissions: "Submissions",
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
    theme: {
        light: "Light",
        dark: "Dark",
        system: "System",
    },
    aaieduButton: {
        purposeLink: "Link",
    },
    notifications: {
        "contest-start": "Contest %1 has started!",
        "contest-end": "Contest %1 has ended!",
        "new-question": "A new question has been posted in %1",
        "new-announcement": "There's a new announcement in %1",
        "question-answer": "Your question has been answered in %1",
        alert: " %1",
    },
    contestJoin: {
        buttonText: "Join contest with code",
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
            searchPlaceholder: "Search contests...",
            noOfficialContests: "No official contests available",
            noOfficialContestsFiltered: "No official contests found",
            noUnofficialContests: "No unofficial contests available",
            noUnofficialContestsFiltered: "No unofficial contests found",
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
                disabled: "The leaderboard is currently disabled",
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
        },
    },
    problems: {
        table: {
            head: {
                status: "Status",
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
            searchPlaceholder: "Search problems...",
            filters: {
                allTags: "All Tags",
                allRatings: "All Ratings",
                clearFilters: "Clear filters",
            },
            noProblems: "No problems found",
            noProblemsFiltered: "Try adjusting your filters",
            noProblemsEmpty: "Check back later for new problems",
        },
        individual: {
            loading: "Loading...",
            description: "Task Statement",
            submissions: "Submissions",
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
        processing: "Processing%1",
        historyDescription: "Your submission history for this problem",
        table: {
            head: {
                user: "User",
                verdict: "Verdict",
                time: "Time",
                memory: "Memory",
                language: "Language",
                points: "Points",
                final: "Final",
                submitted: "Submitted",
                cluster: "Cluster",
                sample: "Sample",
                testcase: "Testcase",
                samples: "Samples",
            },
            body: {
                final: "Final",
                notFinal: "Set final",
                notExam: "Not submitted",
                pointsAchieved: " %1 points",
                clusterIndex: "Cluster %1",
                sampleIndex: "Sample %1",
                testcaseIndex: "Testcase %1",
            },
            overflow: {
                expand: "Expand",
                collapse: "Collapse",
            },
        },
        individual: {
            backToProblem: "Back to Problem",
            title: "Submission",
            sourceCode: "Source Code",
            copied: "Copied!",
            copyCode: "Copy Code",
            samples: "Samples",
            clusters: "Clusters",
            compileError: "Compiler Error",
        },
    },
    account: {
        label: "Account information",
        profile: "Profile",
        fullName: "Full Name",
        email: "E-Mail",
        statistics: "Statistics",
        elo: "ELO Rating",
        permissions: "Permissions",
        logout: "Log Out",
        breadcrumbs: {
            creator: "Creator",
            admin: "Admin",
            organisationAdmin: "Org. Admin",
            owner: "Owner",
        },
        aaiedu: {
            title: "Linked AAI@Edu account",
            userId: "User ID",
            fullName: "Full name",
            email: "E-Mail address",
            associatedOrg: "Associated organisation",
            dob: "Date of birth",
            studentCategory: "Student category",
            professionalStatus: "Professional status",
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
        selectDescription: "Choose an organisation to continue",
        yourOrganisations: "Your Organisations",
        allOrganisations: "All Organisations",
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
            alerts: {
                label: "Alert",
                pushButton: "Push",
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
