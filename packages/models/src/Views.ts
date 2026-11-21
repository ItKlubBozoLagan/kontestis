import { ClusterSubmission } from "./ClusterSubmission";
import { Contest } from "./Contest";
import { EvaluationVariant } from "./Evaluation";
import { Organisation } from "./Organisation";
import { Snowflake } from "./Snowflake";
import { TestcaseSubmission } from "./TestcaseSubmission";
import { User } from "./User";

// Read-only, aggregated API shapes computed by PostgreSQL queries.
//  These are response views, not persisted rows, so they are not versioned.

export type Paginated<T> = {
    items: T[];
    total: number;
};

export type ProblemSummary = {
    id: Snowflake;
    contest_id: Snowflake;
    title: string;
    tags: string[];
    evaluation_variant: EvaluationVariant;
    time_limit_millis: number;
    memory_limit_megabytes: number;
    contest_name: string;
    contest_start_time: Date;
    contest_duration_seconds: number;
    /** sum of all cluster scores */
    score: number;
    /** best score of the requesting user, null if never attempted */
    best_score: number | null;
    attempts: number;
};

export type DashboardOverview = {
    contests: number;
    running_contests: number;
    upcoming_contests: number;
    problems: number;
    submissions: number;
    accepted_submissions: number;
    solved_problems: number;
};

export type ClusterSubmissionDetails = ClusterSubmission & {
    order_number: bigint;
    is_sample: boolean;
    max_score: number;
    testcases: TestcaseSubmission[];
};

export type AdminUserListItem = User & {
    is_managed: boolean;
    is_edu: boolean;
    is_temporary: boolean;
    organisation_count: number;
    submission_count: number;
};

export type AdminContestListItem = Contest & {
    organisation_name: string;
    member_count: number;
    problem_count: number;
};

export type OrganisationOverview = Organisation & {
    owner_name: string | null;
    member_count: number;
    contest_count: number;
};
