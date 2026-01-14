import {
    ClusterSubmissionV2,
    ClusterV2,
    ClusterV3,
    GeneratorV1,
    ProblemV4,
    ProblemV5,
    TestcaseSubmissionV3,
    TestcaseV3,
    TestcaseV4,
} from "@kontestis/models";
import { Migration } from "scyllo";

import { Globals } from "../../globals";
import { Logger } from "../../lib/logger";
import { generateSnowflake } from "../../lib/snowflake";
import { initS3, S3Client } from "../../s3/S3";
import { readBucketStream } from "../../utils/stream";
import { streamQuery } from "../streamQuery";

type MigrationType = {
    generators: GeneratorV1;
    testcases: TestcaseV3 & TestcaseV4;
    clusters: ClusterV2 & ClusterV3;
    problems: ProblemV5;
    testcase_submissions: TestcaseSubmissionV3;
    cluster_submissions: ClusterSubmissionV2;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const migration_improve_generators: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "generators",
        true,
        {
            id: {
                type: "bigint",
            },
            user_id: {
                type: "bigint",
            },
            contest_id: {
                type: "bigint",
            },
            organisation_id: {
                type: "bigint",
            },
            problem_id: {
                type: "bigint",
            },
            code: {
                type: "text",
            },
            name: {
                type: "text",
            },
            language: {
                type: "text",
            },
        },
        "id"
    );

    await database.createIndex("generators", "generators_by_user_id", "user_id");
    await database.createIndex("generators", "generators_by_problem_id", "problem_id");
    await database.createIndex("generators", "generators_by_contest_id", "contest_id");
    await database.createIndex("generators", "generators_by_organisation_id", "organisation_id");

    await database.raw("ALTER TABLE testcases ADD input_type text");
    await database.raw("ALTER TABLE testcases ADD output_type text");
    await database.raw("ALTER TABLE testcases ADD status text");
    await database.raw("ALTER TABLE testcases ADD input_file text");
    await database.raw("ALTER TABLE testcases ADD output_file text");
    await database.raw("ALTER TABLE testcases ADD error text");
    await database.raw("ALTER TABLE testcases ADD generator_input text");
    await database.raw("ALTER TABLE testcases ADD generator_id bigint");

    await database.raw("ALTER TABLE clusters ADD order_number bigint");
    await database.raw("ALTER TABLE clusters ADD status text");
    await database.raw("ALTER TABLE clusters ADD error text");

    await database.raw("ALTER TABLE testcase_submissions ADD input_file text");
    await database.raw("ALTER TABLE testcase_submissions ADD output_file text");
    await database.raw("ALTER TABLE testcase_submissions ADD submission_output_file text");

    const testcases = await streamQuery<TestcaseV3>(database.client, "SELECT * FROM testcases");

    const clusters = await streamQuery<ClusterV2>(database.client, "SELECT * FROM clusters");

    const problems = await streamQuery<Pick<ProblemV4, "id" | "title">>(
        database.client,
        "SELECT id, title FROM problems"
    );

    const clustersById: Record<string, ClusterV2> = {};

    for (const cluster of clusters) {
        clustersById[cluster.id.toString()] = cluster;
    }

    const problemsById: Record<string, Pick<ProblemV5, "title" | "id">> = {};

    for (const problem of problems) {
        problemsById[problem.id.toString()] = problem;
    }

    await initS3();

    for (const testcase of testcases) {
        Logger.info("Migrating testcase " + testcase.id);
        const cluster = clustersById[testcase.cluster_id.toString()];

        if (!cluster) {
            Logger.error("Cluster not found for testcase " + testcase.id);
            continue;
        }

        const problem = problemsById[cluster.problem_id.toString()];

        if (!problem) {
            Logger.error("Problem not found for testcase " + testcase.id);
            continue;
        }

        const inputFilePath = `${problem.title}-${problem.id}/${
            testcase.id
        }-${generateSnowflake()}.in`;

        await S3Client.putObject(Globals.s3.buckets.testcases, inputFilePath, testcase.input);

        await database.update(
            "testcases",
            {
                input_type: "manual",
                output_type: "auto",
                status: "not-ready",
                input_file: inputFilePath,
            },
            { id: testcase.id }
        );

        Logger.info("Migrated testcase " + testcase.id);
    }

    const clustersByProblemId: Record<string, ClusterV2[]> = {};

    for (const cluster of clusters) {
        if (!clustersByProblemId[cluster.problem_id.toString()]) {
            clustersByProblemId[cluster.problem_id.toString()] = [];
        }

        clustersByProblemId[cluster.problem_id.toString()].push(cluster);
    }

    for (const clusters of Object.values(clustersByProblemId)) {
        clusters.sort((a, b) => Number(a.id - b.id));

        for (const [index, cluster] of clusters.entries()) {
            await database.update("clusters", { order_number: BigInt(index) }, { id: cluster.id });
        }
    }

    for (const cluster of clusters) {
        // Migrate to new generator format
        if (!cluster.generator) {
            await database.update("clusters", { status: "not-ready" }, { id: cluster.id });
            continue;
        }

        if (!cluster.generator_language || !cluster.generator_code) {
            Logger.error("Generator language or code not found for cluster " + cluster.id);
            await database.update(
                "clusters",
                {
                    status: "generator-error",
                    error: "Invalid generator state, no language and/or code (migration)",
                },
                { id: cluster.id }
            );
            continue;
        }

        const generator: GeneratorV1 = {
            id: generateSnowflake(),
            problem_id: cluster.problem_id,
            name: `${problemsById[cluster.problem_id.toString()].title}-${cluster.id}`,
            code: cluster.generator_code ?? "",
            language: cluster.generator_language ?? "python",
        };

        await database.insertInto("generators", generator);

        await database.update("clusters", { status: "not-ready" }, { id: cluster.id });

        const batch = database.batch();

        for (let index = 0; index < 10; index++) {
            const testcase: TestcaseV4 = {
                id: generateSnowflake(),
                generator_id: generator.id,
                status: "not-ready",
                cluster_id: cluster.id,
                output_type: "auto",
                input_type: "generator",
                generator_input: index.toString(),
            };

            batch.insertInto("testcases", testcase);
        }
        await batch.execute();
    }

    const testcaseSubmissions = await streamQuery<TestcaseSubmissionV3>(
        database.client,
        "SELECT * FROM testcase_submissions"
    );

    const clusterSubmissionsById: Record<string, ClusterSubmissionV2> = {};
    const clusterSubmissions = await streamQuery<ClusterSubmissionV2>(
        database.client,
        "SELECT * FROM cluster_submissions"
    );

    for (const clusterSubmission of clusterSubmissions) {
        clusterSubmissionsById[clusterSubmission.id.toString()] = clusterSubmission;
    }

    for (const testcaseSubmission of testcaseSubmissions) {
        const clusterSubmission =
            clusterSubmissionsById[testcaseSubmission.cluster_submission_id.toString()];

        if (!clusterSubmission) {
            Logger.error(
                "Cluster submission not found for testcase submission " + testcaseSubmission.id
            );
            continue;
        }

        if (clusterSubmission.submission_id < 0n) {
            continue;
        }

        const prefix = `${clusterSubmission.submission_id}/${clusterSubmission.cluster_id}/`;

        const files = await readBucketStream(
            S3Client.listObjects(Globals.s3.buckets.submission_meta, prefix, true)
        ).catch((error) => {
            Logger.error(
                `Failed to read bucket stream for testcase submission: ${testcaseSubmission.id}`,
                error
            );
        });

        if (!files) continue;

        const fileNames = new Set<string>(files.map((it) => it.name).filter(Boolean) as string[]);

        if (fileNames.size === 0) continue;

        await database.update(
            "testcase_submissions",
            {
                input_file: fileNames.has(`${testcaseSubmission.testcase_id}.in`)
                    ? `${prefix}${testcaseSubmission.testcase_id}.in`
                    : undefined,
                output_file: fileNames.has(`${testcaseSubmission.testcase_id}.out`)
                    ? `${prefix}${testcaseSubmission.testcase_id}.out`
                    : undefined,
                submission_output_file: fileNames.has(`${testcaseSubmission.testcase_id}.sout`)
                    ? `${prefix}${testcaseSubmission.testcase_id}.sout`
                    : undefined,
            },
            { id: testcaseSubmission.id }
        );
    }

    await database.raw("ALTER TABLE testcases DROP input");

    await database.raw("ALTER TABLE clusters DROP generator");
    await database.raw("ALTER TABLE clusters DROP generator_language");
    await database.raw("ALTER TABLE clusters DROP generator_code");

    log("Done");
};
