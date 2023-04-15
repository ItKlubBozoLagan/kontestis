export const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const cutText = (text: string, size: number) =>
    text.length > size ? text.slice(0, size - 3) + "…" : text;

export const textToHexColor = (text: string) => {
    const hash = [...text].reduce(
        (hash, current) => current.codePointAt(0)! + ((hash << 7) - hash),
        0
    );

    let color = "#";

    for (let index = 0; index < 3; index++) {
        // eslint-disable-next-line unicorn/number-literal-case
        const value = Math.max((hash >> (index * 8)) & 0xff, 128);

        color += value.toString(16).padStart(2, "0");
    }

    return color;
};

export const darkenHex = (hex: string, magnitude: number) => {
    const parts: string[] = [];
    const hexNumber = Number.parseInt(hex.slice(1), 16);

    for (let index = 0; index < 3; index++) {
        // eslint-disable-next-line unicorn/number-literal-case
        const part = Math.max(0, Math.min(255, ((hexNumber >> (index * 8)) & 0xff) - magnitude));

        parts.push(part.toString(16).padStart(2, "0"));
    }

    return "#" + parts.reverse().join("");
};

export const hexToRgba = (hex: string, alpha: number) => {
    const matches = hex.match(/[\dA-Fa-f]{2}/g);

    if (!matches || matches.length !== 3) throw new Error("hexToRgba: invalid hex");

    const [r, g, b] = matches.map((v) => Number.parseInt(v, 16));

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
