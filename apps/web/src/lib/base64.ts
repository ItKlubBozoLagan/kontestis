// Submission code travels base64 encoded (UTF-8 bytes), matching the legacy frontend.

export const encodeBase64 = (text: string) => {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    for (const byte of bytes) binary += String.fromCodePoint(byte);

    return btoa(binary);
};

export const decodeBase64 = (base64: string) => {
    try {
        const binary = atob(base64);

        return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.codePointAt(0)!));
    } catch {
        // very old submissions may not be encoded
        return base64;
    }
};
