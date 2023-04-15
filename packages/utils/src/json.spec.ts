import { describe, expect, it } from "@jest/globals";

import { safeParseJson } from "./json";

describe("safeParseJson", () => {
    it("should correctly parse json", () => {
        expect(
            safeParseJson(
                // eslint-disable-next-line quotes
                '{"this": "is","correct":"json","it":2,"has":6,"numbers":true,"works":true}'
            )
        ).toEqual({
            success: true,
            data: {
                this: "is",
                correct: "json",
                it: 2,
                has: 6,
                numbers: true,
                works: true,
            },
        });
    });

    it("should gracefully handle invalid json", () => {
        expect(safeParseJson("clearly not json")).toEqual({
            success: false,
            data: undefined,
        });
    });
});
