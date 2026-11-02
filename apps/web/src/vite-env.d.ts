/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_ENDPOINT?: string;
    readonly VITE_OAUTH_CLIENT_ID?: string;
    readonly VITE_CAPTCHA_SITE_KEY?: string;
    readonly VITE_AAI_EDU_LOGOUT_URL?: string;
    readonly VITE_AAI_EDU_LOGOUT_REDIRECT_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface BigInt {
    toJSON(): string;
}
