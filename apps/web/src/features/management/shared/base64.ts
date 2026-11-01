/** Submission code is stored as base64 of its UTF-8 bytes. */
export const decodeBase64Utf8 = (value: string) => {
    try {
        return new TextDecoder().decode(
            Uint8Array.from(atob(value), (char) => char.codePointAt(0) ?? 0)
        );
    } catch {
        return value;
    }
};
