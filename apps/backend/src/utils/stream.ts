import { BucketStream } from "minio";

export const readBucketStream = <T>(stream: BucketStream<T>): Promise<T[]> =>
    new Promise((resolve, reject) => {
        const data: T[] = [];

        stream.on("data", (chunk) => {
            data.push(chunk);
        });

        stream.on("end", () => {
            resolve(data);
        });

        stream.on("error", (error) => {
            stream.destroy();
            reject(error);
        });
    });
