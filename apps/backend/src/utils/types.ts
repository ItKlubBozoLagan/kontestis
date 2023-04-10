import { Type } from "@sinclair/typebox";

export const BooleanStringSchema = Type.Union([Type.Literal("true"), Type.Literal("false")]);
