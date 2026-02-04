/// <reference types="vite/client" />

// Extend BigInt to include toJSON for serialization
interface BigInt {
    toJSON(): string;
}

interface ImportMetaEnvironment {
    readonly VITE_API_ENDPOINT: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_CAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnvironment;
}
