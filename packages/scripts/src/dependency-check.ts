import fs from "node:fs/promises";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";

import chalk from "chalk";
import { glob } from "glob";
import yaml from "yaml";
import { SafeParseSuccess, z } from "zod";

import { Logger } from "./lib/logger";

//
// TL;DR, this goes through all dependencies in each package.json file in the workspace
//  and compares it with each other to find dependencies with mismatched versions
//

const GlobalConfig = {
    rootDirFiles: ["pnpm-workspace.yaml", "pnpm-workspace.yml"],
    maxRootSearchDepth: 4,
};

const PNPMWorkspaceSchema = z.object({
    packages: z.array(z.string()),
});

const DependencyPackageJson = z.object({
    name: z.optional(z.string()),
    dependencies: z.optional(z.record(z.string())).default({}),
    devDependencies: z.optional(z.record(z.string())).default({}),
});

type PackageInfo = {
    packageJsonPath: string;
} & z.infer<typeof DependencyPackageJson>;

type DependencyVersionInfo = {
    source: string;
    version: string;
    dev: boolean;
};

type DependencyCollection = {
    source: string;
    dependencies: Record<string, string>;
    dev: boolean;
};

type MatchedDependencyMap = Record<string, DependencyVersionInfo[]>;

const verifyRootDirectory = async (path: string) => {
    const files = await fs.readdir(path);

    for (const file of files) {
        const foundFile = GlobalConfig.rootDirFiles.find((it) => it === file);

        if (foundFile) return foundFile;
    }
};

const silentJsonParse = (content: string): unknown => {
    try {
        return JSON.parse(content);
    } catch {
        /* ignored; returns undefined */
    }
};

const generateDependencyCollection = (
    source: string,
    dependencies: Record<string, string>,
    development: boolean
): DependencyCollection => ({
    source,
    dependencies,
    dev: development,
});

const generateVersionInfo = (
    collection: DependencyCollection,
    entry: string
): DependencyVersionInfo => ({
    source: collection.source,
    version: collection.dependencies[entry],
    dev: collection.dev,
});

const nameFromPackageInfo = (info: PackageInfo): string => info.name ?? info.packageJsonPath;

const generateCompareMatrix = (
    first: PackageInfo,
    second: PackageInfo,
    firstName = nameFromPackageInfo(first),
    secondName = nameFromPackageInfo(second)
) => [
    [
        generateDependencyCollection(firstName, first.dependencies, false),
        generateDependencyCollection(secondName, second.dependencies, false),
    ] as const,
    [
        generateDependencyCollection(firstName, first.devDependencies, true),
        generateDependencyCollection(secondName, second.dependencies, false),
    ] as const,
    [
        generateDependencyCollection(firstName, first.dependencies, false),
        generateDependencyCollection(secondName, second.devDependencies, true),
    ] as const,
    [
        generateDependencyCollection(firstName, first.devDependencies, true),
        generateDependencyCollection(secondName, second.devDependencies, true),
    ] as const,
];

const compareDependencies = (
    first: DependencyCollection,
    second: DependencyCollection
): MatchedDependencyMap => {
    const secondNames = Object.keys(second.dependencies);
    const matches = Object.keys(first.dependencies).filter(
        (name) =>
            secondNames.includes(name) && first.dependencies[name] !== second.dependencies[name]
    );

    return Object.assign(
        {},
        ...matches.map((match) => ({
            [match]: [generateVersionInfo(first, match), generateVersionInfo(second, match)],
        }))
    );
};

const joinMatchedCollectionMapInPlace = (
    first: MatchedDependencyMap,
    second: MatchedDependencyMap
) => {
    for (const [match, items] of Object.entries(second)) {
        if (first[match]) first[match].push(...items);
        else first[match] = [...items];
    }

    return first;
};

const start = performance.now();

// main content
// eslint-disable-next-line sonarjs/cognitive-complexity
(async () => {
    const attempts = Array.from({ length: GlobalConfig.maxRootSearchDepth }, (_, index) =>
        Array.from<string>({ length: index }).reduce((directory) => dirname(directory), __dirname)
    );

    const rootInfo = await (async () => {
        for (const attempt of attempts) {
            const rootFile = await verifyRootDirectory(attempt);

            if (rootFile) return [attempt, rootFile];
        }
    })();

    if (!rootInfo) {
        Logger.error("Couldn't find project root");

        return;
    }

    const [rootDirectory, workspaceFile] = rootInfo;

    const workspaceConfig = await fs.readFile(join(rootDirectory, workspaceFile), "utf8");
    const rawParsed = yaml.parse(workspaceConfig);

    const parsed = await PNPMWorkspaceSchema.safeParseAsync(rawParsed);

    if (!parsed.success) {
        Logger.error(`Invalid workspace configuration: ${workspaceFile}`);

        return;
    }

    const packageGlobs = parsed.data.packages.map((it) => it.replace(/\/+$/, "") + "/package.json");

    const globMatches = await glob(packageGlobs, {
        nodir: true,
        cwd: rootDirectory,
        ignore: "**/node_modules/**",
    });

    Logger.info("Found workspace packages", ...globMatches.map((it) => "  ./" + it));

    const contents = await Promise.all(
        globMatches.map(
            async (it) => [it, await fs.readFile(join(rootDirectory, it), "utf8")] as const
        )
    );

    const parsedPackageJsons = (
        await Promise.all(
            contents.map(
                async ([file, content]) =>
                    [
                        file,
                        await DependencyPackageJson.safeParseAsync(silentJsonParse(content)),
                    ] as const
            )
        )
    ).filter(([_, it]) => it.success) as [
        string,
        SafeParseSuccess<z.infer<typeof DependencyPackageJson>>
    ][];

    // formatted as array of { packageJsonPath: string, dependencies: ..., devDependencies: ... }
    //  will be indexing the array later, hence it is the array and not the object
    const dependencyArray = parsedPackageJsons.map(([file, parsed]) => ({
        packageJsonPath: file,
        ...parsed.data,
    }));

    const ambiguousDependencies: Record<string, DependencyVersionInfo[]> = {};

    // ffs, typescript is retarded and can't to for..in loops
    for (let index = 0; index < dependencyArray.length; index++) {
        const scan = dependencyArray[index];

        const selfCompare = compareDependencies(
            generateDependencyCollection(nameFromPackageInfo(scan), scan.dependencies, false),
            generateDependencyCollection(nameFromPackageInfo(scan), scan.devDependencies, true)
        );

        const results: MatchedDependencyMap[] = [selfCompare];

        for (let index2 = index + 1; index2 < dependencyArray.length; index2++) {
            const compare = dependencyArray[index2];

            // there must be a better way
            const compareMatrix = generateCompareMatrix(scan, compare);

            const result = compareMatrix
                .map(([first, second]) => compareDependencies(first, second))
                // eslint-disable-next-line unicorn/prefer-object-from-entries
                .reduce(
                    (accumulator, current) => joinMatchedCollectionMapInPlace(accumulator, current),
                    {}
                );

            results.push(result);
        }

        joinMatchedCollectionMapInPlace(
            ambiguousDependencies,
            // eslint-disable-next-line unicorn/prefer-object-from-entries
            results.reduce(
                (accumulator, current) => joinMatchedCollectionMapInPlace(accumulator, current),
                {}
            )
        );
    }

    const entries = Object.entries(ambiguousDependencies).map(
        ([match, items]) =>
            [
                match,
                items
                    .sort((a, b) => {
                        if (a.version !== b.version) return a.version.localeCompare(b.version);

                        if (a.source !== b.source) return a.source.localeCompare(b.source);

                        if (a.dev !== b.dev) return a.dev ? 1 : -1;

                        return 0;
                    })
                    .filter((it, index, array) =>
                        index === 0
                            ? true
                            : !(
                                  it.source === array[index - 1].source &&
                                  it.version === array[index - 1].version &&
                                  it.dev === array[index - 1].dev
                              )
                    ),
            ] as const
    );

    if (entries.length === 0) {
        Logger.info("All good!");

        return;
    }

    Logger.error(`Found ${entries.length} ambiguous dependencies`);

    for (const [dependency, matches] of entries) {
        Logger.error(
            dependency,
            ...matches.map(
                (match) =>
                    `  ${match.version} ${chalk.gray("from")} ${match.source}${
                        match.dev ? chalk.yellowBright(" - Dev") : ""
                    }`
            )
        );
    }
})().finally(() => {
    Logger.info(`Finished in ${(performance.now() - start).toFixed(2)}ms`);

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
});
