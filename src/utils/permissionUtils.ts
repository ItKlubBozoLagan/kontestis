import {Snowflake} from "../lib/snowflake";
import {DataBase} from "../data/Database";


export const isAllowedToViewProblem = async (userId: Snowflake, problemId: Snowflake) => {
    const contest_id = (await DataBase.selectOneFrom("problems", ["contest_id"], { id: problemId }))?.contest_id;
    if(!contest_id) return false;
    return (await isAllowedToViewContest(userId, contest_id));
}

export const isAllowedToModifyProblem = async (userId: Snowflake, problemId: Snowflake): Promise<boolean> => {
    const contest_id = (await DataBase.selectOneFrom("problems", ["contest_id"], { id: problemId }))?.contest_id;
    if(!contest_id) return false;
    return (await isAllowedToModifyProblem(userId, contest_id));
}

export const isAllowedToModifyContest = async (userId: Snowflake, contestId: Snowflake) => {

    const contest = await DataBase.selectOneFrom("contests", "*", { id: contestId });
    if(!contest) return false;

    if(contest.admin_id == userId) return true;

    const user = await DataBase.selectOneFrom("users", "*", { id: userId });
    if(!user) return false;
    return !!(user.permissions & 1);
};

export const isAllowedToViewContest = async (userId: Snowflake, contestId: Snowflake) => {
    if(await isAllowedToModifyContest(userId, contestId)) return true;

    const allowedUser = DataBase.selectOneFrom("allowed_users", "*", {user_id: userId, contest_id: contestId });

    return !!allowedUser;
};