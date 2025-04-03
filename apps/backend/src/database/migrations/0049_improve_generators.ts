import {
    ClusterSubmissionV2,
    ClusterV2,
    ClusterV3,
    GeneratorV1,
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

    await database.raw("ALTER TABLE testcases ADD COLUMN input_type text");
    await database.raw("ALTER TABLE testcases ADD COLUMN output_type text");
    await database.raw("ALTER TABLE testcases ADD COLUMN status text");
    await database.raw("ALTER TABLE testcases ADD COLUMN input_file text");
    await database.raw("ALTER TABLE testcases ADD COLUMN output_file text");
    await database.raw("ALTER TABLE testcases ADD COLUMN error text");
    await database.raw("ALTER TABLE testcases ADD COLUMN generator_input text");
    await database.raw("ALTER TABLE testcases ADD COLUMN generator_id bigint");

    await database.raw("ALTER TABLE clusters ADD COLUMN order bigint");
    await database.raw("ALTER TABLE clusters ADD COLUMN status text");
    await database.raw("ALTER TABLE clusters ADD COLUMN mode text");
    await database.raw("ALTER TABLE clusters ADD COLUMN error text");
    await database.raw("ALTER TABLE clusters ADD COLUMN auto_generator_id bigint");
    await database.raw("ALTER TABLE clusters ADD COLUMN auto_generator_tests bigint");

    await database.raw("ALTER TABLE testcase_submissions ADD COLUMN input_file text");
    await database.raw("ALTER TABLE testcase_submissions ADD COLUMN output_file text");
    await database.raw("ALTER TABLE testcase_submissions ADD COLUMN submission_output_file text");

    const testcases = await database.selectFrom("testcases", "*");

    const clusters = await database.selectFrom("clusters", "*");

    const problems = await database.selectFrom("problems", ["id", "title"]);

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
        const cluster = clustersById[testcase.cluster_id.toString()];

        if (!cluster) {
            Logger.panic("Cluster not found for testcase " + testcase.id);
        }

        const problem = problemsById[cluster.problem_id.toString()];

        if (!problem) {
            Logger.panic("Problem not found for testcase " + testcase.id);
        }

        const inputFilePath = `${problem.title}-${problem.id}/${
            testcase.id
        }-${generateSnowflake()}.in`;

        await S3Client.putObject(Globals.s3.buckets.submission_meta, inputFilePath, testcase.input);

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
            await database.update("clusters", { order: index }, { id: cluster.id });
        }
    }

    for (const cluster of clusters) {
        // Migrate to new generator format
        if (!cluster.generator) {
            await database.update("clusters", { mode: "custom" }, { id: cluster.id });
            continue;
        }

        if (!cluster.generator_language || !cluster.generator_code) {
            Logger.error("Generator language or code not found for cluster " + cluster.id);
            await database.update("clusters", { mode: "custom" }, { id: cluster.id });
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

        await database.update(
            "clusters",
            { mode: "auto", auto_generator_id: generator.id, auto_generator_tests: 10 },
            { id: cluster.id }
        );
    }

    const testcaseSubmissions = await database.selectFrom("testcase_submissions", "*");

    const clusterSubmissionsById: Record<string, ClusterSubmissionV2> = {};
    const clusterSubmissions = await database.selectFrom("cluster_submissions", "*");

    for (const clusterSubmission of clusterSubmissions) {
        clusterSubmissionsById[clusterSubmission.id.toString()] = clusterSubmission;
    }

    for (const testcaseSubmission of testcaseSubmissions) {
        const clusterSubmission =
            clusterSubmissionsById[testcaseSubmission.cluster_submission_id.toString()];

        if (!clusterSubmission) {
            Logger.panic("Cluster not found for testcase submission " + testcaseSubmission.id);
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

    await database.raw("ALTER TABLE testcases DROP COLUMN input");

    await database.raw("ALTER TABLE clusters DROP COLUMN generator");
    await database.raw("ALTER TABLE clusters DROP COLUMN generator_language");
    await database.raw("ALTER TABLE clusters DROP COLUMN generator_code");

    log("Done");
};
