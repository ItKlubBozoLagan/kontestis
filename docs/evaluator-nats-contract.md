# Evaluator NATS/JetStream contract (v1)

This contract replaces Redis only for the current evaluator path. Problems with
`legacy_evaluation: true` continue to call the legacy HTTP evaluator and continue to receive inline
testcase data. Redis remains required for pending submissions, reevaluation IDs, caches, rate
limits, and task locks.

The backend and evaluator worker changes must be deployed together. Do not deploy the backend
producer until workers understand this contract and consume the JetStream durable described below.

## JetStream resources

The tracked `provision-nats` command creates or reconciles these resources without deleting or
purging existing data:

| Resource | Name / subject | Policy |
| --- | --- | --- |
| Request stream | `KONTESTIS_EVALUATION_REQUESTS_V1` / `kontestis.evaluation.v1.requests` | File, WorkQueue, discard new, six-day max age |
| Worker consumer | `evaluation-workers-v1` | Durable pull, explicit ack, two-minute ack wait, unlimited delivery |
| Result stream | `KONTESTIS_EVALUATION_RESULTS_V1` / `kontestis.evaluation.v1.responses.>` | File, WorkQueue, discard new, six-day max age |
| Backend consumer | `evaluation-backend-<instance>-v1` | Durable pull, filtered to its instance, explicit ack |
| Object Store | `KONTESTIS_EVALUATION_FILES_V1` | Memory, seven-day TTL |

The namespace is configurable with `NATS_EVALUATION_NAMESPACE`. Stream and bucket names are
versioned constants. Queue messages and the NATS server accept at most 64 MiB. A stable
`Nats-Msg-Id` of `evaluation-<evaluation_id>` makes a repeated producer publish idempotent within
the stream's ten-minute duplicate window.

## Evaluation request

The backend publishes UTF-8 JSON to the request subject. The existing `Batch`, `Interactive`, and
`OutputOnly` evaluator variants remain inside the new envelope:

```json
{
    "BeginEvaluation": {
        "schema_version": 1,
        "response_subject": "kontestis.evaluation.v1.responses.backend-1.1234",
        "file_retry_limit": 5,
        "evaluation": {
            "Batch": {
                "id": 1234,
                "code": "...",
                "language": "cpp",
                "testcases": [],
                "time_limit": 1000,
                "memory_limit": 262144,
                "evaluate_all": false
            }
        }
    }
}
```

`evaluation_id` remains a positive, JavaScript-safe integer and is compatible with a Rust `u64`.
The worker publishes exactly one terminal response to `response_subject`. The worker must not trust
arbitrary response subjects from other namespaces.

## File sources

Each testcase `input` and `output` is one of:

```json
{ "type": "inline", "data": "text" }
```

```json
{
    "type": "nats_object",
    "bucket": "KONTESTIS_EVALUATION_FILES_V1",
    "name": "1234-5678-input",
    "size_bytes": 1024
}
```

```json
{
    "type": "s3_presigned_get",
    "url": "https://worker-visible-s3/...",
    "size_bytes": 16777216,
    "etag": "...",
    "expires_at": "2026-09-05T12:00:00.000Z"
}
```

Only testcase files that already exist in S3 are externalized. Generated arguments, missing
expected output, submission code, checker code, and output-only submission content remain inline.
For existing S3 objects, sizes strictly below
`EVALUATION_NATS_OBJECT_THRESHOLD_BYTES` (default 16 MiB) are copied to Object Store. Files exactly
at or above the threshold remain authoritative in S3 and receive a seven-day presigned GET URL
using `S3_EVALUATOR_INSTANCE_URL`.

The backend removes Object Store entries after a terminal result, publish failure, or timeout. The
bucket TTL handles process crashes. Cleanup never deletes the authoritative S3 object.

## Responses and acknowledgement

The existing successful response JSON remains unchanged. The backend validates it, resolves the
pending evaluation, cleans its objects, and acknowledges it. Unknown or duplicate valid responses
are acknowledged. Malformed JSON and schema-invalid responses are terminated to prevent poison
redelivery.

If a worker cannot read a NATS object, it publishes this response and confirms that publish before
NAKing the original request with a delay:

```json
{
    "evaluation_id": 1234,
    "type": "file_unavailable",
    "bucket": "KONTESTIS_EVALUATION_FILES_V1",
    "name": "1234-5678-input",
    "request_delivery_count": 2,
    "retryable": true
}
```

The backend verifies that the object belongs to the pending evaluation, recreates the memory bucket
if necessary, reloads the same object name from its recorded S3 origin, acknowledges the response,
and keeps the evaluation pending for request redelivery. The worker retries while the request
delivery count is below `file_retry_limit`. On the final attempt it terminates the request and
publishes either `file_unavailable` with `retryable: false` or:

```json
{
    "evaluation_id": 1234,
    "type": "evaluation_error",
    "error": "testcase file remained unavailable"
}
```

The backend NAKs a valid response only when its own recovery handling fails. Evaluations time out
after `NATS_EVALUATION_RESPONSE_TIMEOUT_MILLIS` (six days by default), shorter than the seven-day
object and URL lifetime.

## Local provisioning

With `global.env` configured, Compose starts NATS, runs provisioning to completion, and only then
starts the backend. Provisioning can also be run repeatedly from the repository root:

```sh
pnpm --filter @kontestis/backend provision-nats
```

Use `NATS_PROVISION_CREDS_FILE` for an administrative provisioning identity and
`NATS_CREDS_FILE` for the narrower backend runtime identity in secured environments.

With provisioned NATS running, the inline fake-worker contract can be checked with:

```sh
pnpm --filter @kontestis/backend smoke-nats-evaluation
```

With the configured `testcases` S3 bucket also running, `smoke-nats-files` checks the configured
threshold boundary, a missing-object recovery response, and terminal object cleanup. Both commands
use temporary evaluation data; the file smoke removes the S3 objects it creates.
