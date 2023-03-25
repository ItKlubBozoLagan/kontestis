import { AdminPermissions, hasAdminPermission, Organisation } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractModifiableOrganisation } from "../../extractors/extractModifiableOrganisation";
import { DEFAULT_ORGANISATION, extractOrganisation } from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";
import OrganisationMemberHandler from "./OrganisationMemberHandler";

const OrganisationHandler = Router();

const organisationSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
});

OrganisationHandler.use("/:organisation_id/member", OrganisationMemberHandler);

OrganisationHandler.get("/", async (req, res) => {
    const user = await extractUser(req);

    const organisations = await Database.selectFrom("organisations", "*", {});

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_ORGANISATIONS))
        return respond(res, StatusCodes.OK, [DEFAULT_ORGANISATION, ...organisations]);

    const organisationIds = await Database.selectFrom(
        "organisation_members",
        ["organisation_id"],
        {
            user_id: user.id,
        },
        "ALLOW FILTERING"
    );

    return respond(res, StatusCodes.OK, [
        DEFAULT_ORGANISATION,
        ...organisations.filter((o) => organisationIds.some((oid) => oid.organisation_id === o.id)),
    ]);
});

OrganisationHandler.get("/:organisation_id", async (req, res) => {
    const organisation = await extractOrganisation(req);

    return respond(res, StatusCodes.OK, organisation);
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
    await Database.insertInto("organisation_members", {
        id: generateSnowflake(),
        organisation_id: organisation.id,
        user_id: user.id,
    });

    return respond(res, StatusCodes.OK, organisation);
});

OrganisationHandler.patch(
    "/:organisation_id",
    useValidation(organisationSchema),
    async (req, res) => {
        const organisation = await extractModifiableOrganisation(req);

        const exists = await Database.selectOneFrom("organisations", ["id"], {
            name: req.body.name,
        });

        if (exists) throw new SafeError(StatusCodes.CONFLICT);

        await Database.update("organisations", { name: req.body.name }, { id: organisation.id });

        return respond(res, StatusCodes.OK);
    }
);

export default OrganisationHandler;
