import * as https from "node:https";

import * as Minio from "minio";

import { Globals } from "../globals";

export const S3Client = new Minio.Client({
    endPoint: Globals.s3.endpoint,
    port: Globals.s3.port,
    useSSL: Globals.s3.useSSL,
    accessKey: Globals.s3.accessKey,
    secretKey: Globals.s3.secretKey,
    transportAgent:
        Globals.s3.useSSL && !Globals.s3.validateSSL
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined,
});

export const initS3 = async () => {
    const bucketNames = await S3Client.listBuckets().then((buckets) =>
        buckets.map((bucket) => bucket.name)
    );

    const expectedBucketNames = Object.values(Globals.s3.buckets);

    if (!expectedBucketNames.every((bucketName) => bucketNames.includes(bucketName)))
        throw new Error("S3 buckets are not initialized");
};
