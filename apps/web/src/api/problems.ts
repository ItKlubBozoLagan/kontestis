import type {
    Cluster,
    EvaluationLanguage,
    EvaluationVariant,
    Generator,
    ProblemSummary,
    ProblemWithScore,
    Testcase,
} from "@kontestis/models";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api, http } from "@/api/http";

type Id = bigint | string;
const key = (id: Id) => id.toString();

/** Problem as returned to participants (evaluator and solution fields are stripped). */
export type VisibleProblem = Omit<
    ProblemWithScore,
    "evaluation_language" | "evaluation_script" | "solution_language" | "solution_code"
> &
    Partial<
        Pick<
            ProblemWithScore,
            "evaluation_language" | "evaluation_script" | "solution_language" | "solution_code"
        >
    >;

export const problemQueries = {
    /** Every visible problem in the selected organisation with the user's best score. */
    summaries: () =>
        queryOptions({
            queryKey: ["problems", "summaries"],
            queryFn: () => api.get<ProblemSummary[]>("/problem/summaries"),
        }),
    byContest: (contestId: Id) =>
        queryOptions({
            queryKey: ["problems", "contest", key(contestId)],
            queryFn: () => api.get<VisibleProblem[]>("/problem", { contest_id: key(contestId) }),
        }),
    detail: (problemId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId)],
            queryFn: () => api.get<VisibleProblem>(`/problem/${problemId}`),
        }),
    /** problem id -> best score of the logged in user, across every problem */
    scores: () =>
        queryOptions({
            queryKey: ["problems", "scores"],
            queryFn: () => api.get<Record<string, number>>("/problem/scores"),
        }),
    clusters: (problemId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId), "clusters"],
            queryFn: () => api.get<Cluster[]>(`/problem/${problemId}/cluster`),
            select: (clusters) =>
                [...clusters].sort((a, b) => Number(a.order_number - b.order_number)),
        }),
    cluster: (problemId: Id, clusterId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId), "clusters", key(clusterId)],
            queryFn: () => api.get<Cluster>(`/problem/${problemId}/cluster/${clusterId}`),
        }),
    testcases: (problemId: Id, clusterId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId), "clusters", key(clusterId), "testcases"],
            queryFn: () =>
                api.get<Testcase[]>(`/problem/${problemId}/cluster/${clusterId}/testcase`),
        }),
    testcase: (problemId: Id, clusterId: Id, testcaseId: Id) =>
        queryOptions({
            queryKey: [
                "problems",
                key(problemId),
                "clusters",
                key(clusterId),
                "testcases",
                key(testcaseId),
            ],
            queryFn: () =>
                api.get<Testcase>(
                    `/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}`
                ),
        }),
    /** Raw testcase data as plain text (input or expected output). */
    testcaseData: (problemId: Id, clusterId: Id, testcaseId: Id, type: "input" | "output") =>
        queryOptions({
            queryKey: [
                "problems",
                key(problemId),
                "clusters",
                key(clusterId),
                "testcases",
                key(testcaseId),
                type,
            ],
            queryFn: () =>
                http
                    .get<string>(
                        `/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}/${type}`,
                        { responseType: "text", transformResponse: (data) => data }
                    )
                    .then((response) => response.data),
            retry: false,
        }),
    generators: (problemId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId), "generators"],
            queryFn: () => api.get<Generator[]>(`/problem/${problemId}/generator`),
        }),
    generator: (problemId: Id, generatorId: Id) =>
        queryOptions({
            queryKey: ["problems", key(problemId), "generators", key(generatorId)],
            queryFn: () => api.get<Generator>(`/problem/${problemId}/generator/${generatorId}`),
        }),
};

export type ProblemFormValues = {
    title: string;
    description: string;
    evaluation_variant: EvaluationVariant;
    evaluation_language?: EvaluationLanguage;
    evaluation_script?: string;
    time_limit_millis: number;
    memory_limit_megabytes: number;
    solution_language: EvaluationLanguage;
    solution_code: string;
    tags: string[];
};

const useInvalidateProblems = () => {
    const queryClient = useQueryClient();

    return (...keys: unknown[][]) =>
        Promise.all(
            (keys.length > 0 ? keys : [["problems"]]).map((queryKey) =>
                queryClient.invalidateQueries({ queryKey })
            )
        );
};

export const useCreateProblem = (contestId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (body: ProblemFormValues) =>
            api.post<ProblemWithScore>(`/problem/${contestId}`, body),
        onSuccess: () => invalidate(),
    });
};

export const useUpdateProblem = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (body: ProblemFormValues) => api.patch(`/problem/${problemId}`, body),
        onSuccess: () => invalidate(),
    });
};

export const useDeleteProblem = () => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (problemId: Id) => api.delete(`/problem/${problemId}`),
        onSuccess: () => invalidate(),
    });
};

export type ClusterFormValues = {
    awarded_score: number;
    order_number?: number;
    is_sample?: boolean;
    generator_id?: string;
    test_count?: number;
};

export const useCreateCluster = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (body: ClusterFormValues) =>
            api.post<Cluster>(`/problem/${problemId}/cluster`, body),
        onSuccess: () => invalidate(["problems"]),
    });
};

export const useUpdateCluster = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: ({ clusterId, ...body }: ClusterFormValues & { clusterId: Id }) =>
            api.patch(`/problem/${problemId}/cluster/${clusterId}`, body),
        onSuccess: () => invalidate(["problems"]),
    });
};

export const useDeleteCluster = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (clusterId: Id) => api.delete(`/problem/${problemId}/cluster/${clusterId}`),
        onSuccess: () => invalidate(["problems"]),
    });
};

/** "drop" marks the cluster stale, "regenerate" re-runs generators and the solution. */
export const useClusterCache = (problemId: Id, clusterId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (action: "drop" | "regenerate") =>
            api.post(`/problem/${problemId}/cluster/${clusterId}/cache/${action}`),
        onSuccess: () => invalidate(["problems", key(problemId), "clusters"]),
    });
};

export type GeneratorTestcaseValues = {
    output_type: "auto" | "manual";
    generator_id: string;
    generator_input: string;
};

export const useCreateTestcase = (problemId: Id, clusterId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (generator?: GeneratorTestcaseValues) =>
            generator
                ? api.post<Testcase>(
                      `/problem/${problemId}/cluster/${clusterId}/testcase/with-generator`,
                      { input_type: "generator", ...generator }
                  )
                : api.post<Testcase>(`/problem/${problemId}/cluster/${clusterId}/testcase`),
        onSuccess: () => invalidate(["problems", key(problemId), "clusters"]),
    });
};

export const useUpdateTestcase = (problemId: Id, clusterId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: ({
            testcaseId,
            ...body
        }: {
            testcaseId: Id;
            input_type?: "manual" | "generator";
            output_type?: "auto" | "manual";
            generator_id?: string;
            generator_input?: string;
        }) => api.patch(`/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}`, body),
        onSuccess: () => invalidate(["problems", key(problemId), "clusters"]),
    });
};

export const useDeleteTestcase = (problemId: Id, clusterId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (testcaseId: Id) =>
            api.delete(`/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}`),
        onSuccess: () => invalidate(["problems", key(problemId), "clusters"]),
    });
};

export const useUploadTestcaseFile = (problemId: Id, clusterId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: ({
            testcaseId,
            type,
            file,
        }: {
            testcaseId: Id;
            type: "input" | "output";
            file: Blob;
        }) =>
            // the backend reads the upload from the "input" field for both types
            api.upload(
                `/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}/${type}`,
                "input",
                file
            ),
        onSuccess: () => invalidate(["problems", key(problemId), "clusters"]),
    });
};

/** Presigned download URL for a testcase file. */
export const getTestcaseFileUrl = (
    problemId: Id,
    clusterId: Id,
    testcaseId: Id,
    type: "input" | "output"
) =>
    api.get<{ url: string }>(
        `/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}/file/${type}`
    );

export type GeneratorFormValues = {
    name: string;
    code: string;
    language: EvaluationLanguage;
};

export const useCreateGenerator = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (body: GeneratorFormValues) =>
            api.post<Generator>(`/problem/${problemId}/generator`, body),
        onSuccess: () => invalidate(["problems", key(problemId), "generators"]),
    });
};

export const useUpdateGenerator = (problemId: Id, generatorId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (body: GeneratorFormValues) =>
            api.patch(`/problem/${problemId}/generator/${generatorId}`, body),
        onSuccess: () => invalidate(["problems", key(problemId), "generators"]),
    });
};

export const useDeleteGenerator = (problemId: Id) => {
    const invalidate = useInvalidateProblems();

    return useMutation({
        mutationFn: (generatorId: Id) =>
            api.delete(`/problem/${problemId}/generator/${generatorId}`),
        onSuccess: () => invalidate(["problems", key(problemId)]),
    });
};
