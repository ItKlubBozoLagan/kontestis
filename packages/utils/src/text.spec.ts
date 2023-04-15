import { describe, expect, it } from "@jest/globals";

import { capitalize, cutText, darkenHex, hexToRgba, textToHexColor } from "./text";

describe("capitalize", () => {
    it("should capitalize the string", () => {
        expect(capitalize("nIcely CAPITALIzed")).toBe("Nicely capitalized");
    });
});

describe("cutText", () => {
    it("should leave a small text as it", () => {
        expect(cutText("hi", 16)).toBe("hi");
    });

    it("should leave exact length text as it", () => {
        expect(cutText("aaaabbbbccccdddd", 16)).toBe("aaaabbbbccccdddd");
    });

    it("should add ellipses to the end of long text", () => {
        expect(cutText("aaaabbbbccccddddeeeeffff", 16)).toBe("aaaabbbbccccd…");
    });
});

describe("textToHexColor", () => {
    // eslint-disable-next-line quotes
    it('should convert "skole.hr" to a greenish color hex', () => {
        expect(textToHexColor("skole.hr")).toBe("#80ec82");
    });

    // eslint-disable-next-line quotes
    it('should convert "fer.hr" to a darker pinkish color hex', () => {
        expect(textToHexColor("fer.hr")).toBe("#c5808f");
    });
});

describe("darkenHex", () => {
    it("should turn green into a darker green", () => {
        expect(darkenHex("#00ff00", 80)).toBe("#00af00");
    });

    it("should turn green into a lighter green", () => {
        expect(darkenHex("#00ff00", -80)).toBe("#50ff50");
    });
});

describe("hexToRgba", () => {
    it("should convert hex gray to rgb with 0.6 alpha", () => {
        expect(hexToRgba("#808080", 0.6)).toBe("rgba(128, 128, 128, 0.6)");
    });

    it("should throw for invalid hex value", () => {
        expect(() => hexToRgba("#??????", 1)).toThrowError(/invalid hex/);
    });
});
