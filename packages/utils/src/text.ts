export const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const cutText = (text: string, size: number) =>
    text.length > size ? text.slice(0, size - 3) + "…" : text;
