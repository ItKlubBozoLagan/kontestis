import type { EvaluationLanguage } from "@kontestis/models";

/** Languages a participant can submit in (output-only problems accept raw output instead). */
export const SUBMISSION_LANGUAGES: EvaluationLanguage[] = [
    "cpp",
    "c",
    "python",
    "java",
    "go",
    "rust",
    "ocaml",
    "gnu_asm_x86_linux",
];

/** Languages usable for evaluators, checkers, generators and reference solutions. */
export const TOOLING_LANGUAGES: EvaluationLanguage[] = ["python", "cpp", "c", "java", "go", "rust"];

export const FILE_EXTENSIONS: Partial<Record<EvaluationLanguage, string[]>> = {
    c: ["c", "h"],
    cpp: ["cpp", "cc", "cxx", "hpp"],
    python: ["py"],
    java: ["java"],
    go: ["go"],
    rust: ["rs"],
    ocaml: ["ml"],
    gnu_asm_x86_linux: ["s", "asm"],
};

export const languageFromFilename = (name: string): EvaluationLanguage | undefined => {
    const extension = name.split(".").at(-1)?.toLowerCase();

    if (!extension) return undefined;

    return (Object.entries(FILE_EXTENSIONS) as [EvaluationLanguage, string[]][]).find(
        ([, extensions]) => extensions.includes(extension)
    )?.[0];
};
