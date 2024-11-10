import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import axios from "axios";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

import { Globals } from "../globals";

type OpenIdConfiguration = {
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
};

export let AaiEduOpenIdConfiguration: OpenIdConfiguration;
let AaiEduJwks: JwksClient;

export const initAaiEdu = async () => {
    AaiEduOpenIdConfiguration = await axios
        .get<OpenIdConfiguration>(Globals.aaiEduConfigurationUrl)
        .then((data) => data.data);

    AaiEduJwks = jwksClient({
        jwksUri: AaiEduOpenIdConfiguration.jwks_uri,
    });
};

export const AaiEduIdTokenSchema = Type.Object({
    cn: Type.Tuple([Type.String()]),
    mail: Type.Tuple([Type.String()]),
    o: Type.Tuple([Type.String()]),
    hrEduPersonUniqueID: Type.Tuple([Type.String()]),
    hrEduPersonDateOfBirth: Type.Optional(Type.Tuple([Type.String()])),
    hrEduPersonStudentCategory: Type.Optional(Type.Tuple([Type.String()])),
    hrEduPersonProfessionalStatus: Type.Optional(Type.Tuple([Type.String()])),
});

const AaiEduIdTokenSchemaCompiled = TypeCompiler.Compile(AaiEduIdTokenSchema);

export type AaiEduTokenData = Static<typeof AaiEduIdTokenSchema>;

type ExchangeResponse =
    | {
          success: false;
      }
    | {
          success: true;
          data: AaiEduTokenData;
          id_token: string;
      };

const validateJwksIdToken = async (token: string): Promise<JwtPayload | null> =>
    new Promise<JwtPayload | null>((resolve) =>
        jsonwebtoken.verify(
            token,
            async (header, callback) => {
                const key = await AaiEduJwks.getSigningKey(header.kid)
                    .then((it) => ({ success: true, data: it } as const))
                    .catch((error) => ({ success: false, error: error as Error } as const));

                if (!key.success) return callback(key.error);

                callback(
                    null,
                    "publicKey" in key.data ? key.data.publicKey : key.data.rsaPublicKey
                );
            },
            (error, decoded) => {
                if (error !== null) return resolve(null);

                if (!decoded || typeof decoded === "string") return resolve(null);

                return resolve(decoded);
            }
        )
    );

export const aaiEduExchangeAuthorizationToken = async (code: string): Promise<ExchangeResponse> => {
    const parameters = new URLSearchParams();

    parameters.set("grant_type", "authorization_code");
    parameters.set("client_id", Globals.aaiEduClientId);
    parameters.set("client_secret", Globals.aaiEduClientSecret);
    parameters.set("code", code);
    parameters.set("redirect_uri", Globals.aaiEduRedirectUri);

    const response = await axios
        .post<{ id_token: string }>(AaiEduOpenIdConfiguration.token_endpoint, parameters, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        .then((it) => it.data)
        .catch(() => null);

    if (!response) return { success: false };

    const { id_token } = response;

    const valid = await validateJwksIdToken(id_token);

    if (!valid) return { success: false };

    if (!AaiEduIdTokenSchemaCompiled.Check(valid)) return { success: false };

    return { success: true, data: valid, id_token };
};
