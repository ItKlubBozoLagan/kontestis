import { URLSearchParams } from "node:url";

import { Hash } from "@aws-sdk/hash-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";

import { Globals } from "../globals";

export const s3OfflinePresignGetObject = async (
    bucketName: string,
    objectName: string,
    expire: number,
    parameters?: Record<string, string>
) => {
    let baseUrl = `${Globals.s3.instanceUrl}/${bucketName}/${objectName}`;

    if (parameters) {
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(parameters)) {
            query.append(key, value);
        }

        baseUrl += `?${query.toString()}`;
    }

    const s3ObjectUrl = parseUrl(baseUrl);

    console.log(new HttpRequest(s3ObjectUrl));
    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: Globals.s3.accessKey,
            secretAccessKey: Globals.s3.secretKey,
        },
        region: "us-east-1",
        sha256: Hash.bind(null, "sha256"),
    });

    const url = await presigner.presign(new HttpRequest(s3ObjectUrl), { expiresIn: expire });

    console.log(url);

    return formatUrl(url);
};
