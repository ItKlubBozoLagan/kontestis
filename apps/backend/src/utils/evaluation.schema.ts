import { Type } from "@sinclair/typebox";

export const EvaluationLanguageSchema = Type.Union([
    Type.Literal("python"),
    Type.Literal("c"),
    Type.Literal("cpp"),
    Type.Literal("java"),
    Type.Literal("go"),
    Type.Literal("rust"),
    Type.Literal("esl"),
]);
