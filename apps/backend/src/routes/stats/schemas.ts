import { Type } from "@sinclair/typebox";

export const RangeQuerySchema = Type.Object({
    range: Type.Union([
        Type.Literal("24h"),
        Type.Literal("7d"),
        Type.Literal("30d"),
        Type.Literal("1y"),
        // TODO: max range
        //  originally I was planning on adding this,
        //  but it's just way to finicky for me to deal with at the moment
    ]),
});
