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

    const users = await Database.selectFrom("known_users", "*", {
        user_id: eqIn(
            ...organisationMembers.map((organisationMember) => organisationMember.user_id)
        ),
    });

    return respond(
        res,
        StatusCodes.OK,
        organisationMembers.map((it) => ({
            ...it,
            ...R.pick(users.find((user) => user.user_id === it.user_id)!, ["email", "full_name"]),
        }))
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
    const organisation = await extractModifiableOrganisation(
        req,
        extractIdFromParameters(req, "organisation_id")
    );

    const targetUser = await Database.selectOneFrom(
        "known_users",
        ["user_id"],
        {
            email: req.body.email,
        },
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "ALLOW FILTERING"
    );

    if (!targetUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const exists = await Database.selectOneFrom("organisation_members", ["id"], {
        organisation_id: organisation.id,
        user_id: targetUser.user_id,
    });

    if (exists) throw new SafeError(StatusCodes.CONFLICT);

    const member: OrganisationMember = {
        id: generateSnowflake(),
        elo: DEFAULT_ELO,
        organisation_id: organisation.id,
        user_id: targetUser.user_id,
        permissions: grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.VIEW),
    };

    await Database.insertInto("organisation_members", member);

    return respond(res, StatusCodes.OK, member);
});

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
