import stream from "node:stream";

import {
    AdminPermissions,
    Cluster,
    Contest,
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
    hasContestPermission as requestHasContestPermission,
    hasOrganisationPermission,
    mustHaveContestPermission,
    mustHaveCurrentOrganisationPermission,
} from "../../preconditions/hasPermission";
import { Repositories } from "../../repositories/Repositories";
import { randomSequence } from "../../utils/random";
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
        name: contest.name + " (Copy)",
    };

    await Repositories.contests.insert(newContest);

    const problems = await Repositories.problems.select("*", { contest_id: contest.id });

    await Promise.all(
        problems.map(async (problem) => {
            const newProblem: Problem = {
                ...problem,
                id: generateSnowflake(),
                contest_id: newContest.id,
            };

            await Repositories.problems.insert(newProblem);

            const clusters = await Repositories.clusters.select("*", { problem_id: problem.id });

            const generators = await Repositories.generators.select("*", {
                problem_id: problem.id,
            });

            const generatorIdTranslation: Record<string, string> = {};

            await Promise.all(
                generators.map(async (generator) => {
                    const newId = generateSnowflake();

                    generatorIdTranslation[generator.id.toString()] = newId.toString();

                    await Repositories.generators.insert({
                        ...generator,
                        id: newId,
                        contest_id: newContest.id,
                        organisation_id: organisationId,
                        problem_id: newProblem.id,
                    });
                })
            );

            await Promise.all(
                clusters.map(async (cluster) => {
                    const newCluster: Cluster = {
                        ...cluster,
                        id: generateSnowflake(),
                        problem_id: newProblem.id,
                    };

                    await Repositories.clusters.insert(newCluster);

                    const testcases = await Repositories.testcases.select("*", {
                        cluster_id: cluster.id,
                    });

                    await Promise.all(
                        testcases.map(async (testcase) => {
                            await Repositories.testcases.insert({
                                ...testcase,
                                id: generateSnowflake(),
                                generator_id: testcase.generator_id
                                    ? BigInt(
                                          generatorIdTranslation[testcase.generator_id.toString()]
                                      )
                                    : null,
                                cluster_id: newCluster.id,
                            });
                        })
                    );
                })
            );
        })
    );

    await Repositories.contest_members.insert({
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
        Repositories.contests.insert(contest),
        Repositories.contest_members.insert({
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

    const contest = await Repositories.contests.selectOne(
        ["id", "organisation_id", "start_time", "duration_seconds"],
        {
            join_code: req.body.join_code,
        }
    );

    if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

    if (contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now())
        throw new SafeError(StatusCodes.NOT_FOUND);

    const organisationMember = await Repositories.organisation_members.selectOne(["id"], {
        organisation_id: contest.organisation_id,
        user_id: user.id,
    });

    if (!organisationMember)
        await Repositories.organisation_members.insert({
            id: generateSnowflake(),
            user_id: user.id,
            organisation_id: contest.organisation_id,
            permissions: grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.VIEW),
            elo: DEFAULT_ELO,
        });

    const contestMember = await Repositories.contest_members.selectOne(["id"], {
        contest_id: contest.id,
        user_id: user.id,
    });

    if (!contestMember)
        await Repositories.contest_members.insert({
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

    await Repositories.contests.update({ join_code: code }, { id: contest.id });

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

    await Repositories.contests.update(
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

    const members = await Repositories.contest_members.select(["user_id"], {
        contest_id: contest.id,
    });

    // yes ik, very hacky
    const oldContestNotifications = await Repositories.notifications.select(["id"], {
        data: contest.name,
    });

    await Promise.all(
        oldContestNotifications.map((it) => Repositories.notifications.delete("*", { id: it.id }))
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

const getContestsForTemporaryUser = async (userId: bigint): Promise<Contest[]> => {
    const contests = await Repositories.contests.selectForTemporaryUser(userId);

    return contests.flatMap(({ member_contest_permissions: permissions, ...contest }) =>
        permissions !== null && hasContestPermission(permissions, ContestMemberPermissions.VIEW)
            ? [contest]
            : []
    );
};

ContestHandler.get("/", async (req, res) => {
    const optionalUser = await extractOptionalUser(req);

    if (optionalUser?.is_temporary) {
        return respond(res, StatusCodes.OK, await getContestsForTemporaryUser(optionalUser.id));
    }

    const organisation = await extractCurrentOrganisation(req);

    const contests = await Repositories.contests.selectForOrganisationWithMembership(
        organisation.id,
        optionalUser?.id
    );

    const hasViewContestsPermission = await hasOrganisationPermission(
        req,
        OrganisationPermissions.VIEW_CONTEST,
        organisation.id
    );

    const isEduUser = optionalUser?.is_edu ?? false;

    const isContestVisible = (contest: (typeof contests)[number]): boolean => {
        if (hasViewContestsPermission) return true;

        if (contest.public && contest.require_edu_verification && isEduUser) return true;

        if (contest.public && !contest.require_edu_verification) return true;

        return (
            contest.member_contest_permissions !== null &&
            hasContestPermission(contest.member_contest_permissions, ContestMemberPermissions.VIEW)
        );
    };

    return respond(
        res,
        StatusCodes.OK,
        contests
            .filter(isContestVisible)
            .map(({ member_contest_permissions: _, ...contest }) => contest)
    );
});
ContestHandler.get("/:contest_id/export/:user_id", async (req, res) => {
    const contest = await extractContest(req);

    await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const targetUser = await Repositories.users.selectOne(["id", "full_name"], {
        id: BigInt(req.params.user_id),
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
    const contestMembers = await Repositories.contest_members.select("*", { user_id: user.id });

    return respond(
        res,
        StatusCodes.OK,
        contestMembers.map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

const LeaderboardQuerySchema = Type.Object({
    show_all_users: Type.Optional(Type.Union([Type.Literal("true"), Type.Literal("false")])),
});

ContestHandler.get(
    "/:contest_id/leaderboard",
    useValidation(LeaderboardQuerySchema, { query: true }),
    async (req, res) => {
        const contest = await extractContest(req);

        if (
            (!contest.show_leaderboard_during_contest || !isContestRunning(contest)) &&
            !isContestOver(contest)
        ) {
            await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);
        }

        const joinedMembers = await Repositories.contest_members.selectLeaderboard(
            contest.id,
            contest.organisation_id
        );

        if (
            joinedMembers.some(
                (member) =>
                    member.user_full_name === null ||
                    member.user_email === null ||
                    member.user_permissions === null
            )
        )
            throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

        const showAll =
            req.query.show_all_users === "true" &&
            (await requestHasContestPermission(
                req,
                ContestMemberPermissions.VIEW_PRIVATE,
                contest.id
            ).catch(() => false));

        const contestMembers = joinedMembers.filter(
            (member) =>
                showAll ||
                !hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.VIEW_PRIVATE,
                    member.user_permissions!
                )
        );

        return respond(
            res,
            StatusCodes.OK,
            contestMembers.map(
                ({
                    user_full_name,
                    user_email,
                    user_permissions: _,
                    edu_full_name,
                    edu_email,
                    organisation_elo,
                    ...member
                }) => ({
                    ...member,
                    elo: organisation_elo ?? DEFAULT_ELO,
                    full_name:
                        (contest.require_edu_verification && edu_full_name) || user_full_name!,
                    email_domain: user_email!.split("@").at(-1),
                    edu_mail_domain: edu_email?.split("@").at(-1),
                    score: member.score ?? {},
                })
            )
        );
    }
);

ContestHandler.get("/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    return respond(res, StatusCodes.OK, contest);
});

export default ContestHandler;
