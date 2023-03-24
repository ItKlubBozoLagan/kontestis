import {
    AdminPermissions,
    hasAdminPermission,
    Organisation,
    OrganisationMember,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractOrganisation } from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { respond } from "../../utils/response";

const OrganisationHandler = Router();

const organisationSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
});

OrganisationHandler.post("/", useValidation(organisationSchema), async (req, res) => {
    const user = await extractUser(req);

    const exists = await Database.selectOneFrom("organisations", ["id"], { name: req.body.name });

    if (exists) throw new SafeError(StatusCodes.CONFLICT);

    const organisation: Organisation = {
        id: generateSnowflake(),
        name: req.body.name,
        owner: user.id,
        // TODO: Make a way to add this and also store it... pain
        avatar_url: "",
    };

    await Database.insertInto("organisations", organisation);

    return respond(res, StatusCodes.OK, organisation);
});

OrganisationHandler.get("/", async (req, res) => {
    const user = await extractUser(req);

    const organisations = await Database.selectFrom("organisations", "*", {});

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_ORGANISATIONS))
        return respond(res, StatusCodes.OK, organisations);

    const organisationIds = await Database.selectFrom("organisation_members", ["organisation_id"], {
        user_id: user.id,
    });

    return respond(
        res,
        StatusCodes.OK,
        organisations.filter((o) => organisationIds.some((oid) => oid.organisation_id === o.id))
    );
});

OrganisationHandler.get("/:organisation_id", async (req, res) => {
    const organisation = await extractOrganisation(
        req,
        extractIdFromParameters(req, "organisation_id")
    );

    return respond(res, StatusCodes.OK, organisation);
});

OrganisationHandler.get("/members", async (req, res) => {
    const organisation = await extractOrganisation(req);

    const organisationMembers = await Database.selectFrom("organisation_members", "*", {
        organisation_id: organisation.id,
    });

    return respond(res, StatusCodes.OK, organisationMembers);
});

// TODO: Make this more robust
OrganisationHandler.post("/members/:user_id", async (req, res) => {
    const organisation = await extractOrganisation(req);
    const user = await extractUser(req);

    const targetUserId = extractIdFromParameters(req, "user_id");

    if (user.id !== organisation.owner) throw new SafeError(StatusCodes.FORBIDDEN);

    const exists = await Database.selectOneFrom(
        "organisation_members",
        ["id"],
        {
            organisation_id: organisation.id,
            user_id: targetUserId,
        },
        "ALLOW FILTERING"
    );

    if (exists) throw new SafeError(StatusCodes.CONFLICT);

    const member: OrganisationMember = {
        id: generateSnowflake(),
        organisation_id: organisation.id,
        user_id: user.id,
    };

    await Database.insertInto("organisation_members", member);

    return respond(res, StatusCodes.OK, member);
});

OrganisationHandler.delete("/members/:user_id", async (req, res) => {
    const organisation = await extractOrganisation(req);
    const user = await extractUser(req);

    const targetUserId = extractIdFromParameters(req, "user_id");

    if (user.id !== organisation.owner) throw new SafeError(StatusCodes.FORBIDDEN);

    const exists = await Database.selectOneFrom(
        "organisation_members",
        ["id"],
        {
            organisation_id: organisation.id,
            user_id: targetUserId,
        },
        "ALLOW FILTERING"
    );

    if (!exists) throw new SafeError(StatusCodes.CONFLICT);

    await Database.deleteFrom("organisation_members", "*", {
        id: exists.id,
    });

    return respond(res, StatusCodes.OK);
});

export default OrganisationHandler;
