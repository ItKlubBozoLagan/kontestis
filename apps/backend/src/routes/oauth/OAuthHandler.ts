import { Type } from "@sinclair/typebox";
import { Request, Response, Router, urlencoded } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import {
    authenticateClient,
    consumeAuthorizationCode,
    createAuthorizationCode,
    findClient,
    issueAccessToken,
    verifyAccessToken,
} from "../../lib/oauthProvider";
import { useValidation } from "../../middlewares/useValidation";
import { Repositories } from "../../repositories/Repositories";
import { respond } from "../../utils/response";

// `/client` and `/authorize` are called by the kontestis frontend and use the regular response
// envelope. `/token` and `/userinfo` are called by the external applications' backends and
// follow RFC 6749 / OpenID Connect shapes instead, so that standard OAuth client libraries
// work against them.
const OAuthHandler = Router();

const ClientQuerySchema = Type.Object({
    client_id: Type.String(),
    redirect_uri: Type.String(),
});

const mustFindClient = (clientId: string, redirectUri: string) => {
    const client = findClient(clientId, redirectUri);

    if (!client) throw new SafeError(StatusCodes.NOT_FOUND);

    return client;
};

const mustBeRegularUser = async (req: Request) => {
    const user = await extractUser(req);

    // temporary accounts are scoped to a single organisation's exam and must not leave it
    if (user.is_temporary) throw new SafeError(StatusCodes.FORBIDDEN);

    return user;
};

OAuthHandler.get("/client", useValidation(ClientQuerySchema, { query: true }), async (req, res) => {
    await mustBeRegularUser(req);

    const client = mustFindClient(req.query.client_id, req.query.redirect_uri);

    return respond(res, StatusCodes.OK, { name: client.name });
});

const AuthorizeSchema = Type.Object({
    client_id: Type.String(),
    redirect_uri: Type.String(),
    state: Type.Optional(Type.String({ maxLength: 1024 })),
});

OAuthHandler.post("/authorize", useValidation(AuthorizeSchema), async (req, res) => {
    const user = await mustBeRegularUser(req);

    const client = mustFindClient(req.body.client_id, req.body.redirect_uri);

    const code = await createAuthorizationCode(client, req.body.redirect_uri, user.id);

    const redirect = new URL(req.body.redirect_uri);

    redirect.searchParams.set("code", code);

    if (req.body.state !== undefined) redirect.searchParams.set("state", req.body.state);

    return respond(res, StatusCodes.OK, { redirect: redirect.toString() });
});

// token responses must never be cached (RFC 6749 5.1)
const noStore = (res: Response) => res.set("Cache-Control", "no-store");

const oauthError = (res: Response, status: StatusCodes, error: string) => {
    noStore(res).status(status).json({ error });
};

const invalidToken = (res: Response) => {
    // eslint-disable-next-line quotes -- prettier and `quotes` disagree on embedded double quotes
    res.set("WWW-Authenticate", 'Bearer error="invalid_token"');

    return oauthError(res, StatusCodes.UNAUTHORIZED, "invalid_token");
};

const clientCredentials = (req: Request): { id: string; secret: string } | null => {
    const authorization = req.header("authorization");

    if (authorization?.startsWith("Basic ")) {
        const decoded = Buffer.from(authorization.slice("Basic ".length), "base64").toString();
        const separator = decoded.indexOf(":");

        if (separator < 0) return null;

        return {
            id: decodeURIComponent(decoded.slice(0, separator)),
            secret: decodeURIComponent(decoded.slice(separator + 1)),
        };
    }

    const { client_id, client_secret } = req.body;

    if (typeof client_id !== "string" || typeof client_secret !== "string") return null;

    return { id: client_id, secret: client_secret };
};

// accepts both form-encoded (the standard) and JSON bodies
OAuthHandler.post("/token", urlencoded({ extended: false }), async (req, res) => {
    const credentials = clientCredentials(req);
    const client = credentials && authenticateClient(credentials.id, credentials.secret);

    if (!client) return oauthError(res, StatusCodes.UNAUTHORIZED, "invalid_client");

    const { grant_type, code, redirect_uri } = req.body;

    if (grant_type !== "authorization_code")
        return oauthError(res, StatusCodes.BAD_REQUEST, "unsupported_grant_type");

    if (typeof code !== "string" || typeof redirect_uri !== "string")
        return oauthError(res, StatusCodes.BAD_REQUEST, "invalid_request");

    const data = await consumeAuthorizationCode(code);

    if (!data || data.client_id !== client.id || data.redirect_uri !== redirect_uri)
        return oauthError(res, StatusCodes.BAD_REQUEST, "invalid_grant");

    const { token, expiresIn } = issueAccessToken(client, data.user_id);

    noStore(res).status(StatusCodes.OK).json({
        access_token: token,
        token_type: "Bearer",
        expires_in: expiresIn,
    });
});

// Everything an application needs to make its own authorization decisions. Permission
// bitsets are decimal strings; bit `n` is set when the permission with enum index `n` in
// @kontestis/models (AdminPermissions, OrganisationPermissions, ContestMemberPermissions)
// is granted. Applications must apply the same overrides kontestis does (see
// preconditions/hasPermission.ts).
OAuthHandler.get("/userinfo", async (req, res) => {
    const authorization = req.header("authorization");
    const access =
        authorization?.startsWith("Bearer ") &&
        verifyAccessToken(authorization.slice("Bearer ".length));

    if (!access) return invalidToken(res);

    const user = await Repositories.users.selectOne("*", { id: access.userId });

    if (!user) return invalidToken(res);

    const [organisations, contests] = await Promise.all([
        Repositories.organisation_members.select(["organisation_id", "permissions"], {
            user_id: user.id,
        }),
        Repositories.contest_members.select(["contest_id", "contest_permissions"], {
            user_id: user.id,
        }),
    ]);

    noStore(res)
        .status(StatusCodes.OK)
        .json({
            sub: user.id.toString(),
            name: user.full_name,
            email: user.email,
            picture: user.picture_url,
            permissions: user.permissions.toString(),
            organisations: organisations.map((it) => ({
                organisation_id: it.organisation_id.toString(),
                permissions: it.permissions.toString(),
            })),
            contests: contests.map((it) => ({
                contest_id: it.contest_id.toString(),
                permissions: it.contest_permissions.toString(),
            })),
        });
});

export default OAuthHandler;
