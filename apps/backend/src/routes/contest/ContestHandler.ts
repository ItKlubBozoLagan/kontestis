import stream from "node:stream";

import {
    AdminPermissions,
    Cluster,
    Contest,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Problem,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import {
    extractCurrentOrganisation,
    extractOrganisation,
} from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { generateDocument } from "../../lib/document";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { R } from "../../utils/remeda";
import { respond } from "../../utils/response";
import ContestAnnouncementHandler from "./ContestAnnouncementHandler";
import ContestGradingHandler from "./ContestGradingHandler";
import ContestMemberHandler from "./ContestMemberHandler";
import ContestQuestionHandler from "./ContestQuestionHandler";

const ContestHandler = Router();

const contestSchema = Type.Object({
    name: Type.String(),
    past_contest: Type.Optional(Type.Boolean({ default: false })),
    start_time_millis: Type.Number(),
    duration_seconds: Type.Number({
        minimum: 10 * 60,
        maximum: 7 * 24 * 60 * 60,
    }),
    public: Type.Boolean(),
    official: Type.Boolean(),
    exam: Type.Boolean(),
});

ContestHandler.use("/:contest_id/members", ContestMemberHandler);
ContestHandler.use("/:contest_id/question", ContestQuestionHandler);
ContestHandler.use("/:contest_id/announcement", ContestAnnouncementHandler);
ContestHandler.use("/:contest_id/grade", ContestGradingHandler);

const copySchema = Type.Object({
    organisation_id: Type.String(),
});

ContestHandler.post("/:contest_id/copy", useValidation(copySchema), async (req, res) => {
    const user = await extractUser(req);
    const contest = await extractModifiableContest(req);

    if (!/^\d+$/.test(req.body.organisation_id)) throw new SafeError(StatusCodes.BAD_REQUEST);

    const organisationId = BigInt(req.body.organisation_id);

    await extractOrganisation(req, organisationId);

    const newContest: Contest = {
        ...contest,
        id: generateSnowflake(),
        organisation_id: organisationId,
    };

    await Database.insertInto("contests", newContest);

    const problems = await Database.selectFrom("problems", "*", { contest_id: contest.id });

    await Promise.all(
        problems.map(async (problem) => {
            const newProblem: Problem = {
                ...problem,
                id: generateSnowflake(),
                contest_id: newContest.id,
            };

            await Database.insertInto("problems", newProblem);

            const clusters = await Database.selectFrom("clusters", "*", { problem_id: problem.id });

            await Promise.all(
                clusters.map(async (cluster) => {
                    const newCluster: Cluster = {
                        ...cluster,
                        id: generateSnowflake(),
                        problem_id: newProblem.id,
                    };

                    await Database.insertInto("clusters", newCluster);

                    const testcases = await Database.selectFrom("testcases", "*", {
                        cluster_id: cluster.id,
                    });

                    await Promise.all(
                        testcases.map(async (testcase) => {
                            await Database.insertInto("testcases", {
                                ...testcase,
                                id: generateSnowflake(),
                                cluster_id: newCluster.id,
                            });
                        })
                    );
                })
            );
        })
    );

    await Database.insertInto("contest_members", {
        id: generateSnowflake(),
        contest_id: newContest.id,
        user_id: user.id,
        contest_permissions: grantPermission(0n, ContestMemberPermissions.ADMIN),
    });

    return respond(res, StatusCodes.OK, newContest);
});

ContestHandler.post("/", useValidation(contestSchema), async (req, res) => {
    const user = await extractUser(req);

    const organisation = await extractCurrentOrganisation(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADD_CONTEST))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const date = new Date(req.body.start_time_millis);

    if (!date || (!req.body.past_contest && req.body.start_time_millis < Date.now()))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADMIN) && req.body.official)
        throw new SafeError(StatusCodes.FORBIDDEN);

    const contest: Contest = {
        id: generateSnowflake(),
        organisation_id: organisation.id,
        name: req.body.name,
        admin_id: user.id, // legacy
        start_time: date,
        duration_seconds: req.body.duration_seconds,
        official: req.body.official,
        public: req.body.public,
        elo_applied: false,
        exam: req.body.exam,
    };

    await Promise.all([
        Database.insertInto("contests", contest),
        Database.insertInto("contest_members", {
            id: generateSnowflake(),
            user_id: user.id,
            contest_id: contest.id,
            contest_permissions: grantPermission(EMPTY_PERMISSIONS, ContestMemberPermissions.ADMIN),
        }),
    ]);

    return respond(res, StatusCodes.OK, contest);
});

ContestHandler.patch("/:contest_id", useValidation(contestSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);
    const user = await extractUser(req);

    const date = new Date(req.body.start_time_millis);

    if (!date) throw new SafeError(StatusCodes.BAD_REQUEST);

    if (
        !hasAdminPermission(user.permissions, AdminPermissions.ADMIN) &&
        contest.official !== req.body.official
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    await Database.update(
        "contests",
        {
            name: req.body.name,
            start_time: date,
            duration_seconds: req.body.duration_seconds,
            public: req.body.public,
            official: req.body.official,
            exam: req.body.exam,
        },
        { id: contest.id }
    );

    respond(res, StatusCodes.OK);
});

ContestHandler.get("/", async (req, res) => {
    const contestIds = await Database.selectFrom("contests", ["id", "organisation_id"]);
    const contests = [];

    const organisation = await extractCurrentOrganisation(req);

    for (const id of contestIds) {
        if (id.organisation_id !== organisation.id) continue;

        try {
            contests.push(await extractContest(req, id.id));
        } catch {
            // TODO: Clean this up a bit
        }
    }

    return respond(res, StatusCodes.OK, contests);
});
ContestHandler.get("/:contest_id/export/:user_id", async (req, res) => {
    const contest = await extractContest(req);

    const member = await extractContestMember(req);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const targetUser = await Database.selectOneFrom("users", ["id"], { id: req.params.user_id });

    if (!targetUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const buffer = await generateDocument(contest.id, targetUser.id);

    const readStream = new stream.PassThrough();

    const userData = await Database.selectOneFrom("known_users", ["full_name"], {
        user_id: targetUser.id,
    });

    if (!userData) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    readStream.end(buffer);

    const filename = contest.name + " " + userData.full_name;

    res.set(
        "Content-Disposition",
        "attachment; filename=" + filename.replace(/[^\dA-Za-z]/g, "_") + ".docx"
    );
    res.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    readStream.pipe(res);
});

ContestHandler.get("/members/self", async (req, res) => {
    const user = await extractUser(req);
    const contestMembers = await Database.selectFrom(
        "contest_members",
        "*",
        { user_id: user.id },
        "ALLOW FILTERING"
    );

    return respond(
        res,
        StatusCodes.OK,
        contestMembers.map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

ContestHandler.get("/:contest_id/leaderboard", async (req, res) => {
    const contest = await extractContest(req);

    const contestMembers = await Database.selectFrom("contest_members", "*", {
        contest_id: contest.id,
    });

    const users = await Database.selectFrom("known_users", "*", {
        user_id: eqIn(...contestMembers.map((it) => it.user_id)),
    });

    await Database.selectFrom("users", "*", {
        id: eqIn(...contestMembers.map((it) => it.user_id)),
    });
    const organisationMembers = await Database.selectFrom(
        "organisation_members",
        "*",
        {
            organisation_id: contest.organisation_id,
        },
        "ALLOW FILTERING"
    );

    return respond(
        res,
        StatusCodes.OK,
        contestMembers
            .map((it) => ({
                ...it,
                ...R.pick(users.find((user) => user.user_id === it.user_id)!, [
                    "email",
                    "full_name",
                ]),
                ...R.pick(organisationMembers.find((member) => member.user_id === it.user_id)!, [
                    "elo",
                ]),
            }))
            .map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

ContestHandler.get("/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    return respond(res, StatusCodes.OK, contest);
});

export default ContestHandler;
