import stream from "node:stream";

import {
    AdminPermissions,
    Cluster,
    Contest,
    ContestMember,
    ContestMemberPermissions,
    DEFAULT_ELO,
    hasAdminPermission,
    hasContestPermission,
    OrganisationPermissions,
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
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import { extractOptionalUser } from "../../extractors/extractOptionalUser";
import {
    extractCurrentOrganisation,
    extractOrganisation,
} from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { isContestOver, isContestRunning, pushContestNotifications } from "../../lib/contest";
import { generateDocument } from "../../lib/document";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import {
    hasOrganisationPermission,
    mustHaveContestPermission,
    mustHaveCurrentOrganisationPermission,
} from "../../preconditions/hasPermission";
import { randomSequence } from "../../utils/random";
import { R } from "../../utils/remeda";
import { respond } from "../../utils/response";
import ContestAnnouncementHandler from "./ContestAnnouncementHandler";
import ContestGradingHandler from "./ContestGradingHandler";
import ContestMemberHandler from "./ContestMemberHandler";
import ContestQuestionHandler from "./ContestQuestionHandler";

const ContestHandler = Router();

const ContestSchema = Type.Object({
    name: Type.String(),
    past_contest: Type.Optional(Type.Boolean({ default: false })),
    start_time_millis: Type.Number(),
    duration_seconds: Type.Number({
        minimum: 10 * 60,
        maximum: 7 * 24 * 60 * 60,
    }),
    show_leaderboard: Type.Boolean({ default: true }),
    public: Type.Boolean(),
    official: Type.Boolean(),
    exam: Type.Boolean(),
});

ContestHandler.use("/:contest_id/members", ContestMemberHandler);
ContestHandler.use("/:contest_id/question", ContestQuestionHandler);
ContestHandler.use("/:contest_id/announcement", ContestAnnouncementHandler);
ContestHandler.use("/:contest_id/grade", ContestGradingHandler);

const CopySchema = Type.Object({
    organisation_id: Type.String(),
});

ContestHandler.post("/:contest_id/copy", useValidation(CopySchema), async (req, res) => {
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

    const _ = pushContestNotifications(contest, [user.id]);

    // I'm adding an artificial delay here because I don't want this to be fast
    //  since it's something you wouldn't want to do often,
    //  a slower response time will give people less incentive to spam it
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return respond(res, StatusCodes.OK, newContest);
});

ContestHandler.post("/", useValidation(ContestSchema), async (req, res) => {
    const user = await extractUser(req);

    const organisation = await extractCurrentOrganisation(req);

    await mustHaveCurrentOrganisationPermission(req, OrganisationPermissions.ADD_CONTEST);

    const date = new Date(req.body.start_time_millis);

    if (!date || (!req.body.past_contest && req.body.start_time_millis < Date.now()))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    if (
        req.body.official &&
        !(await hasOrganisationPermission(req, OrganisationPermissions.ADMIN, organisation.id))
    )
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
        join_code: randomSequence(8),
        require_edu_verification: false,
        show_leaderboard_during_contest: true,
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

    const _ = pushContestNotifications(contest, [user.id]);

    return respond(res, StatusCodes.OK, contest);
});

const JoinSchema = Type.Object({
    join_code: Type.String(),
});

ContestHandler.post("/join", useValidation(JoinSchema), async (req, res) => {
    const user = await extractUser(req);

    const contest = await Database.selectOneFrom(
        "contests",
        ["id", "organisation_id", "start_time", "duration_seconds"],
        {
            join_code: req.body.join_code,
        }
    );

    if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

    if (contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now())
        throw new SafeError(StatusCodes.NOT_FOUND);

    const organisationMember = await Database.selectOneFrom("organisation_members", ["id"], {
        organisation_id: contest.organisation_id,
        user_id: user.id,
    });

    if (!organisationMember)
        await Database.insertInto("organisation_members", {
            id: generateSnowflake(),
            user_id: user.id,
            organisation_id: contest.organisation_id,
            permissions: grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.VIEW),
            elo: DEFAULT_ELO,
        });

    const contestMember = await Database.selectOneFrom("contest_members", ["id"], {
        contest_id: contest.id,
        user_id: user.id,
    });

    if (!contestMember)
        await Database.insertInto("contest_members", {
            id: generateSnowflake(),
            user_id: user.id,
            contest_id: contest.id,
            contest_permissions: grantPermission(0n, ContestMemberPermissions.VIEW),
        });

    return respond(res, StatusCodes.OK, {
        contest_id: contest.id,
        organisation_id: contest.organisation_id,
    });
});
ContestHandler.patch("/:contest_id/join", async (req, res) => {
    const contest = await extractModifiableContest(req);

    const code = randomSequence(8);

    await Database.update("contests", { join_code: code }, { id: contest.id });

    return respond(res, StatusCodes.OK, { code });
});

ContestHandler.patch("/:contest_id", useValidation(ContestSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);
    const user = await extractUser(req);

    const date = new Date(req.body.start_time_millis);

    if (!date) throw new SafeError(StatusCodes.BAD_REQUEST);

    if (
        !hasAdminPermission(user.permissions, AdminPermissions.ADMIN) &&
        contest.official !== req.body.official
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    const newName = req.body.name;

    await Database.update(
        "contests",
        {
            name: newName,
            start_time: date,
            duration_seconds: req.body.duration_seconds,
            public: req.body.public,
            official: req.body.official,
            exam: req.body.exam,
            show_leaderboard_during_contest: req.body.show_leaderboard,
        },
        { id: contest.id }
    );

    const members = await Database.selectFrom("contest_members", ["user_id"], {
        contest_id: contest.id,
    });

    // yes ik, very hacky
    const oldContestNotifications = await Database.selectFrom(
        "notifications",
        ["id"],
        {
            data: contest.name,
        },
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "ALLOW FILTERING"
    );

    await Promise.all(
        oldContestNotifications.map((it) =>
            Database.deleteFrom("notifications", "*", { id: it.id })
        )
    );

    const _ = pushContestNotifications(
        {
            name: newName,
            start_time: date,
            duration_seconds: req.body.duration_seconds,
        },
        members.map((it) => it.user_id)
    );

    respond(res, StatusCodes.OK);
});

ContestHandler.get("/", async (req, res) => {
    const organisation = await extractCurrentOrganisation(req);

    const contests = await Database.selectFrom("contests", "*", {
        organisation_id: organisation.id,
    });
    const returnedContests: Array<Contest> = [];

    const hasViewContestsPermission = await hasOrganisationPermission(
        req,
        OrganisationPermissions.VIEW_CONTEST,
        organisation.id
    );

    const optionalUser = await extractOptionalUser(req);

    const isEduUser = optionalUser?.is_edu ?? false;

    // TODO: FIX
    const contestMembers = optionalUser
        ? await Database.selectFrom(
              "contest_members",
              "*",
              { user_id: optionalUser.id },
              "ALLOW FILTERING"
          )
        : [];

    const contestMembersByContestId: Record<string, ContestMember> = {};

    for (const member of contestMembers) {
        contestMembersByContestId[member.contest_id.toString()] = member;
    }

    for (const contest of contests) {
        if (hasViewContestsPermission) {
            returnedContests.push(contest);
            continue;
        }

        if (contest.public && contest.require_edu_verification && isEduUser) {
            returnedContests.push(contest);
            continue;
        }

        if (contest.public && !contest.require_edu_verification) {
            returnedContests.push(contest);
            continue;
        }

        const member = contestMembersByContestId[contest.id.toString()];

        if (
            member &&
            hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW)
        ) {
            returnedContests.push(contest);
        }
    }

    return respond(res, StatusCodes.OK, returnedContests);
});
ContestHandler.get("/:contest_id/export/:user_id", async (req, res) => {
    const contest = await extractContest(req);

    await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const targetUser = await Database.selectOneFrom("users", ["id", "full_name"], {
        id: req.params.user_id,
    });

    if (!targetUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const buffer = await generateDocument(contest.id, targetUser.id);

    const readStream = new stream.PassThrough();

    readStream.end(buffer);

    const filename = contest.name + " " + targetUser.full_name;

    res.header(
        "Content-Disposition",
        "attachment; filename=" + filename.replace(/[^\dA-Za-z]/g, "_") + ".docx"
    );
    res.header(
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

    if (
        (!contest.show_leaderboard_during_contest || !isContestRunning(contest)) &&
        !isContestOver(contest)
    ) {
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);
    }

    const contestMembers = await Database.selectFrom("contest_members", "*", {
        contest_id: contest.id,
    });

    const users = (
        await Promise.all(
            R.chunk(contestMembers, 100).map((chunk) => {
                return Database.selectFrom("users", "*", {
                    id: eqIn(...chunk.map((it) => it.user_id)),
                });
            })
        )
    ).flat();

    const eduUsers = (
        await Promise.all(
            R.chunk(contestMembers, 100).map((chunk) => {
                return Database.selectFrom("edu_users", "*", {
                    id: eqIn(...chunk.map((it) => it.user_id)),
                });
            })
        )
    ).flat();

    const organisationMembers = await Database.selectFrom(
        "organisation_members",
        "*",
        {
            organisation_id: contest.organisation_id,
        },
        "ALLOW FILTERING"
    );

    // if for every contestMember doesn't exist a corresponding user
    if (!contestMembers.every((it) => users.some((user) => user.id === it.user_id)))
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    return respond(
        res,
        StatusCodes.OK,
        contestMembers
            .map(
                (
                    it,
                    _,
                    __,
                    user = users.find((user) => user.id === it.user_id)!,
                    eduUser = eduUsers.find((user) => user.id === it.user_id)
                ) => ({
                    ...it,
                    ...R.pick(user, ["full_name"]),
                    ...R.pick(
                        organisationMembers.find((member) => member.user_id === it.user_id)!,
                        ["elo"]
                    ),
                    email_domain: user.email.split("@").at(-1),
                    edu_mail_domain: eduUser?.email.split("@").at(-1),
                })
            )
            .map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

ContestHandler.get("/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    return respond(res, StatusCodes.OK, contest);
});

export default ContestHandler;
