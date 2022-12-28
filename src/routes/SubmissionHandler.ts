import {Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {
    isAllowedToModifyContest,
    isAllowedToViewContest,
    isAllowedToViewProblem,
    isAllowedToViewSubmission
} from "../utils/utills";
import {Submission} from "../types/Submission";
import {generateSnowflake} from "../lib/snowflake";
import {DataBase} from "../data/Database";


const SubmissionHandler = Router();

enum EvaluationLanguage {
    c = "c",
    cpp = "cpp",
    py = "python"
}

const submissionSchema = Type.Object({
    language: Type.Enum(EvaluationLanguage),
    code: Type.String({ maxLength: 64000 })
});

SubmissionHandler.post("/:problem_id", useAuth, useValidation(submissionSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof submissionSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    if(!(await isAllowedToViewProblem(req.user.id, req.params.problem_id))) return res.status(404).send("Not found!");

    const submission: Submission = {
        id: generateSnowflake(),
        user_id: req.user.id,
        problem_id: req.params.problem_id,
        language: req.body.language,
        code: req.body.code,
        completed: false
    }

    await DataBase.insertInto("submissions", submission);

    // TODO: Start evaluation process.

    return res.status(200).json(submission);
});

SubmissionHandler.get("/:problem_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await DataBase.selectOneFrom("problems", ["contest_id"], { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    const contest = await DataBase.selectOneFrom("contests", "*", { id: problem.contest_id });
    if(!contest) return res.status(500).send("Internal error!");
    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, contest.id))) return res.status(404).send("Not found!");

    const submissions = await DataBase.selectFrom("submissions", "*",
        req.query.user_id ? { problem_id: req.params.problem_id, user_id: req.params.user_id }
            : { problem_id: req.params.problem_id });

    if(req.query.user_id || contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now()) return res.status(200).json(submissions);

    if(!req.user) return res.status(404).send("Not found!");

    const user = req.user;
    if(await isAllowedToModifyContest(user.id, contest.id)) return res.status(200).json(submissions);

    return res.status(200).json(submissions.filter(s => s.user_id === user.id));

});

SubmissionHandler.get("/submission/:submission_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const submission = await DataBase.selectOneFrom("submissions", "*", { id: req.params.submission_id });
    if(!submission) return res.status(404).send("Not found!");
    if(!(await isAllowedToViewSubmission(req.user ? req.user.id : undefined, submission.id))) return res.status(404).send("Not found!");

    return res.status(200).json(submission);
});

SubmissionHandler.get("/cluster/:submission_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const submission = await DataBase.selectOneFrom("submissions", "*", { id: req.params.submission_id });
    if(!submission) return res.status(404).send("Not found!");
    if(!(await isAllowedToViewSubmission(req.user ? req.user.id : undefined, submission.id))) return res.status(404).send("Not found!");

    const clusters = await DataBase.selectFrom("cluster_submissions", "*", { submission_id: submission.id });
    return res.status(200).json(clusters);
});

SubmissionHandler.get("/testcase/:submission_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const submission = await DataBase.selectOneFrom("submissions", "*", { id: req.params.submission_id });
    if(!submission) return res.status(404).send("Not found!");
    if(!(await isAllowedToViewSubmission(req.user ? req.user.id : undefined, submission.id))) return res.status(404).send("Not found!");

    const testcases = await DataBase.selectFrom("testcase_submissions", "*", { submission_id: submission.id });
    return res.status(200).json(testcases);
});

export default SubmissionHandler;