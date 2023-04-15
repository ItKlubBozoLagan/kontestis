import { describe, expect, it } from "@jest/globals";

import { formatDuration, toCroatianLocale } from "./time";

describe("toCroatianLocale", () => {
    it("should parse date and time with the croatian locale", () => {
        expect(toCroatianLocale(new Date(Date.UTC(2038, 0, 19, 2, 14, 7)))).toBe(
            "19. 01. 2038. 03:14:07"
        );
    });

    it("should parse only date with the croatian locale", () => {
        expect(toCroatianLocale(new Date(2004, 9, 22), true)).toBe("22. 10. 2004.");
    });
});

describe("formatDuration", () => {
    it("should format the duration up to seconds", () => {
        expect(formatDuration(180_122_000)).toBe("2d 2h 2m 2s");
    });

    it("should format the duration up to minutes", () => {
        expect(formatDuration(180_120_000)).toBe("2d 2h 2m");
    });

    it("should format the duration up to hours", () => {
        expect(formatDuration(180_000_000)).toBe("2d 2h");
    });

    it("should format the duration up to days", () => {
        expect(formatDuration(172_800_000)).toBe("2d");
    });
});
