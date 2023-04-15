import { describe, expect, it } from "@jest/globals";

import { mapFields } from "./functions";

describe("mapFields", () => {
    it("should try map select fields to a number", () => {
        expect(
            mapFields(
                {
                    foo: "bar",
                    bar: "baz",
                    baz: "foo",
                    couldBeANumber: "2",
                    maybeAnotherNumber: "4",
                    definitelyNotANumber: "hi",
                },
                ["couldBeANumber", "maybeAnotherNumber", "definitelyNotANumber"],
                Number
            )
        ).toEqual({
            foo: "bar",
            bar: "baz",
            baz: "foo",
            couldBeANumber: 2,
            maybeAnotherNumber: 4,
            definitelyNotANumber: Number.NaN,
        });
    });

    it("should not change any fields", () => {
        expect(
            mapFields(
                {
                    foo: "bar",
                    bar: "baz",
                },
                [],
                Number
            )
        ).toEqual({ foo: "bar", bar: "baz" });
    });
});
