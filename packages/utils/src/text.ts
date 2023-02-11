export const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const cutText = (text: string, size: number) =>
    text.length > size ? text.slice(0, size - 3) + "…" : text;

export const textToColor = (text: string) => {
    const hash = [...text].reduce(
        (hash, current) => current.codePointAt(0)! + ((hash << 7) - hash),
        0
    );

    let color = "#";

    for (let index = 0; index < 3; index++) {
        // eslint-disable-next-line unicorn/number-literal-case
        const value = (hash >> (index * 8)) & 0xff;

        color += ("00" + value.toString(16)).slice(-2);
    }

    return color;
};

export const darkenHex = (hex: string, magnitude: number) => {
    const parts = [];
    const hexNumber = Number.parseInt(hex.slice(1), 16);

    for (let index = 0; index < 3; index++) {
        // eslint-disable-next-line unicorn/number-literal-case
        const part = Math.max(0, Math.min(255, ((hexNumber >> (index * 8)) & 0xff) - magnitude));

        parts.push(("00" + part.toString(16)).slice(-2));
    }

    return "#" + parts.reverse().join("");
};
