const to8bit = (text: string) => {
    const uint8Text = new TextEncoder().encode(text);

    return uint8Text.reduce(
        (accumulator, current) => accumulator + String.fromCodePoint(current),
        ""
    );
};

const from8bit = (text: string) => {
    const uint8Text = Uint8Array.from(
        { length: text.length },
        (element, index) => text.codePointAt(index) as number
    );

    return new TextDecoder().decode(uint8Text);
};

export const convertToBase64 = (text: string) => {
    return btoa(to8bit(text));
};

export const convertFromBase64 = (base64: string) => {
    return from8bit(atob(base64));
};
