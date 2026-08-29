export type StoredEvaluationFile = {
    type: "s3_object";
    bucket: string;
    key: string;
};

export type EvaluationFileInput = string | StoredEvaluationFile;

export type InlineEvaluationFileSource = {
    type: "inline";
    data: string;
};

export type NatsObjectEvaluationFileSource = {
    type: "nats_object";
    bucket: string;
    name: string;
    size_bytes: number;
};

export type S3EvaluationFileSource = {
    type: "s3_presigned_get";
    url: string;
    size_bytes: number;
    etag: string;
    expires_at: string;
};

export type EvaluationFileSource =
    | InlineEvaluationFileSource
    | NatsObjectEvaluationFileSource
    | S3EvaluationFileSource;

export type EvaluationFileOrigin = {
    bucket: string;
    key: string;
};
