import { DEFAULT_ELO, OrganisationMember, OrganisationPermissions } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractModifiableOrganisation } from "../../extractors/extractModifiableOrganisation";
import { extractOrganisation } from "../../extractors/extractOrganisation";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { mustHaveOrganisationPermission } from "../../preconditions/hasPermission";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { R } from "../../utils/remeda";
import { respond } from "../../utils/response";

const OrganisationMemberHandler = Router({ mergeParams: true });

OrganisationMemberHandler.get("/", async (req, res) => {
    const organisation = await extractOrganisation(req);

    const organisationMembers = await Database.selectFrom(
        "organisation_members",
        "*",
        {
            organisation_id: organisation.id,
        },
        "ALLOW FILTERING"
    );

    const users = await Database.selectFrom("users", "*", {
        id: eqIn(...organisationMembers.map((organisationMember) => organisationMember.user_id)),
    });

    const eduUsers = await Database.selectFrom("edu_users", "*", {
        id: eqIn(...organisationMembers.map((organisationMember) => organisationMember.user_id)),
    });

    return respond(
        res,
        StatusCodes.OK,
        organisationMembers.map(
            (
                it,
                _,
                __,
                user = users.find((user) => user.id === it.user_id)!,
                eduUser = eduUsers.find((user) => user.id === it.user_id)
            ) => ({
                ...it,
                ...R.pick(user, ["full_name"]),
                email_domain: user.email.split("@").at(-1),
                edu_mail_domain: eduUser?.email.split("@").at(-1),
            })
        )
    );
});

OrganisationMemberHandler.get("/:user_id", async (req, res) => {
    const organisation = await extractOrganisation(req);
    const userId = extractIdFromParameters(req, "user_id");

    const member = await Database.selectOneFrom("organisation_members", "*", {
        organisation_id: organisation.id,
        user_id: userId,
    });

    if (!member) throw new SafeError(StatusCodes.NOT_FOUND);

    return respond(res, StatusCodes.OK, member);
});

// TODO: make this more robust

const MemberSchema = Type.Object({
    email: Type.String(),
});

OrganisationMemberHandler.post("/", useValidation(MemberSchema), async (req, res) => {
    const organisation = await extractOrganisation(req);

    await mustHaveOrganisationPermission(req, OrganisationPermissions.EDIT_USER, organisation.id);

    const targetUser = await Database.selectOneFrom("users", ["id"], {
        email: req.body.email,
    });

    if (!targetUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const exists = await Database.selectOneFrom("organisation_members", ["id"], {
        organisation_id: organisation.id,
        user_id: targetUser.id,
    });

    if (exists) throw new SafeError(StatusCodes.CONFLICT);

    const member: OrganisationMember = {
        id: generateSnowflake(),
        elo: DEFAULT_ELO,
        organisation_id: organisation.id,
        user_id: targetUser.id,
        permissions: grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.VIEW),
    };

    await Database.insertInto("organisation_members", member);

    return respond(res, StatusCodes.OK, member);
});

const MemberUpdateSchema = Type.Object({
    permissions: Type.String(),
    elo: Type.Number(),
});

OrganisationMemberHandler.patch(
    "/:user_id",
    useValidation(MemberUpdateSchema),
    async (req, res) => {
        const organisation = await extractOrganisation(req);

        const newPermissions = req.body.permissions ? BigInt(req.body.permissions) : undefined;

        if (typeof newPermissions === "undefined") throw new SafeError(StatusCodes.BAD_REQUEST);

        await mustHaveOrganisationPermission(req, OrganisationPermissions.EDIT_USER);

        const targetMember = await Database.selectOneFrom(
            "organisation_members",
            ["id", "user_id", "organisation_id"],
            {
                organisation_id: organisation.id,
                user_id: extractIdFromParameters(req, "user_id"),
            }
        );

        if (!targetMember) throw new SafeError(StatusCodes.NOT_FOUND);

        await Database.update(
            "organisation_members",
            {
                permissions: newPermissions,
                elo: req.body.elo,
            },
            {
                organisation_id: targetMember.organisation_id,
                user_id: targetMember.user_id,
                id: targetMember.id,
            }
        );

        return respond(res, StatusCodes.OK);
    }
);

OrganisationMemberHandler.delete("/:user_id", async (req, res) => {
    const organisation = await extractModifiableOrganisation(
        req,
        extractIdFromParameters(req, "organisation_id")
    );

    const targetUserId = extractIdFromParameters(req, "user_id");

    const member = await Database.selectOneFrom("organisation_members", "*", {
        organisation_id: organisation.id,
        user_id: targetUserId,
    });

    if (!member) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.deleteFrom("organisation_members", "*", {
        id: member.id,
    });

    return respond(res, StatusCodes.OK, member);
});

export default OrganisationMemberHandler;
