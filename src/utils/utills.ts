import {Snowflake} from "../lib/snowflake";
import {DataBase} from "../data/Database";


// TODO: Remove all this, do middlewares

export const isAllowedToViewSubmission = async (userId: Snowflake | undefined, submissionId: Snowflake) => {

    const submission = await DataBase.selectOneFrom("submissions", ["problem_id", "user_id"], { id: submissionId });
    if(!submission) return false;

    const problem = await DataBase.selectOneFrom("problems", ["contest_id"], { id: submission.problem_id });
    if(!problem) return false;

    const contest = await DataBase.selectOneFrom("contests", ["id", "start_time", "duration_seconds"], { id: problem.contest_id });
    if(!contest) return false;

    if(!(await isAllowedToViewContest( userId ?? undefined, contest.id))) return false;
    if(contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now()) return true;
    if(!userId) return false;

    return await isAllowedToModifyContest(userId, contest.id) || userId === submission.user_id;
}

export const isAllowedToViewProblem = async (userId: Snowflake | undefined, problemId: Snowflake) => {

    const problem = await DataBase.selectOneFrom("problems", "*", { id: problemId });
    if(!problem) return false;

    const contest = await DataBase.selectOneFrom("contests", "*", { id: problem.contest_id });
    if(!contest) return false;

    if(await isAllowedToModifyContest(userId, contest.id)) return true;
    if(!(await isAllowedToViewContest(userId, contest.id))) return false;

    return contest.start_time.getTime() >= Date.now();
}

export const isAllowedToModifyContest = async (userId: Snowflake | undefined, contestId: Snowflake) => {

    const contest = await DataBase.selectOneFrom("contests", "*", { id: contestId });
    if(!contest) return false;
    if(!userId) return false;

    if(contest.admin_id == userId) return true;

    const user = await DataBase.selectOneFrom("users", "*", { id: userId });
    if(!user) return false;
    return !!(user.permissions & 1);
};

export const isAllowedToViewContest = async (userId: Snowflake | undefined, contestId: Snowflake) => {

    const contest = await DataBase.selectOneFrom("contests", "*", { id: contestId });
    if(!contest) return false;
    if(contest.public) return true;

    if(await isAllowedToModifyContest(userId, contestId)) return true;

    if(!userId) return false;

    const allowedUser = DataBase.selectOneFrom("allowed_users", "*", {user_id: userId, contest_id: contestId });
    return !!allowedUser;
};