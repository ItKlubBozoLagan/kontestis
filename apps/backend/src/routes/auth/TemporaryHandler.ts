import {
    AdminPermissions,
    ContestMemberPermissions,
    DEFAULT_ELO,
    hasAdminPermission,
    OrganisationPermissions,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { hash, verify } from "argon2";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { generateGravatarUrl, generateJwt } from "../../lib/auth";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { randomSequence } from "../../utils/random";
import { respond } from "../../utils/response";

const TemporaryHandler = Router();

const LoginSchema = Type.Object({
    username: Type.String(),
    password: Type.String({ minLength: 1, maxLength: 1024 }),
});

TemporaryHandler.post("/login", useValidation(LoginSchema, { body: true }), async (req, res) => {
    const temporaryUser = await Database.selectOneFrom("temporary_users", "*", {
        username: req.body.username,
    });

    if (!temporaryUser) throw new SafeError(StatusCodes.UNAUTHORIZED);

    const verifyResult = await verify(temporaryUser.password, req.body.password);

    if (!verifyResult) throw new SafeError(StatusCodes.UNAUTHORIZED);

    const user = await Database.selectOneFrom("users", "*", {
        id: temporaryUser.id,
    });

    if (!user) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    return respond(res, StatusCodes.OK, { token: generateJwt(user.id, "temporary", {}) });
});

const stripDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036F]/g, "");

const generateUsernameFromName = (fullName: string, prefix: string): string => {
    const parts = fullName.trim().split(/\s+/);

    const firstName = stripDiacritics(parts[0])
        .toLowerCase()
        .replace(/[^a-z]/g, "");
    const lastName = stripDiacritics(parts[parts.length - 1])
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    const base = parts.length > 1 ? firstName.charAt(0) + lastName : firstName;

    return `${prefix}_${base}`;
};

const BulkCreateSchema = Type.Object({
    names: Type.Array(Type.String({ minLength: 1, maxLength: 128 }), {
        minItems: 1,
        maxItems: 500,
    }),
    contest_ids: Type.Array(Type.String(), { minItems: 1 }),
    prefix: Type.String({ minLength: 1, maxLength: 64 }),
});

const resolveUniqueUsername = async (baseUsername: string): Promise<string> => {
    let username = baseUsername;
    let suffix = 1;
    let existingUser = await Database.selectOneFrom("temporary_users", ["id"], {
        username,
    });

    while (existingUser) {
        suffix++;
        username = `${baseUsername}${suffix}`;
        existingUser = await Database.selectOneFrom("temporary_users", ["id"], {
            username,
        });
    }

    return username;
};

const createTemporaryUser = async (
    name: string,
    username: string,
    organisationId: bigint,
    contests: Array<{ id: bigint; organisation_id: bigint }>
) => {
    const plainPassword = randomSequence(6);
    const passwordHash = await hash(plainPassword);

    const id = generateSnowflake();
    const syntheticEmail = `${username}@temporary.kontestis.local`;

    await Database.insertInto("users", {
        id,
        email: syntheticEmail,
        full_name: name,
        picture_url: generateGravatarUrl(syntheticEmail),
        permissions: EMPTY_PERMISSIONS,
    });

    await Database.insertInto("temporary_users", {
        id,
        username,
        password: passwordHash,
        organisation_id: organisationId,
        created_at: new Date(),
    });

    const uniqueOrgIds = [...new Set(contests.map((c) => c.organisation_id.toString()))];

    for (const orgId of uniqueOrgIds) {
        const existingOrgMember = await Database.selectOneFrom("organisation_members", ["id"], {
            organisation_id: BigInt(orgId),
            user_id: id,
        });

        if (!existingOrgMember) {
            await Database.insertInto("organisation_members", {
                id: generateSnowflake(),
                user_id: id,
                organisation_id: BigInt(orgId),
                elo: DEFAULT_ELO,
                permissions: grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.VIEW),
            });
        }
    }

    for (const contest of contests) {
        await Database.insertInto("contest_members", {
            id: generateSnowflake(),
            user_id: id,
            contest_id: contest.id,
            contest_permissions: grantPermission(0n, ContestMemberPermissions.VIEW),
        });
    }

    return plainPassword;
};

TemporaryHandler.post(
    "/bulk-create",
    useValidation(BulkCreateSchema, { body: true }),
    async (req, res) => {
        const user = await extractUser(req);

        if (!hasAdminPermission(user.permissions, AdminPermissions.ADMIN))
            throw new SafeError(StatusCodes.FORBIDDEN);

        const contestIds = req.body.contest_ids.map((id: string) => {
            if (!/^\d+$/.test(id)) throw new SafeError(StatusCodes.BAD_REQUEST);

            return BigInt(id);
        });

        const contests = await Promise.all(
            contestIds.map(async (contestId: bigint) => {
                const contest = await Database.selectOneFrom("contests", "*", { id: contestId });

                if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

                return contest;
            })
        );

        const organisationId = contests[0].organisation_id;

        const prefix = req.body.prefix.toLowerCase().replace(/[^\da-z]/g, "");

        if (prefix.length === 0) throw new SafeError(StatusCodes.BAD_REQUEST);

        const results: Array<{ name: string; username: string; password: string }> = [];

        for (const name of req.body.names) {
            const baseUsername = generateUsernameFromName(name, prefix);
            const username = await resolveUniqueUsername(baseUsername);
            const plainPassword = await createTemporaryUser(
                name,
                username,
                organisationId,
                contests
            );

            results.push({ name, username, password: plainPassword });
        }

        return respond(res, StatusCodes.OK, results);
    }
);

export default TemporaryHandler;
