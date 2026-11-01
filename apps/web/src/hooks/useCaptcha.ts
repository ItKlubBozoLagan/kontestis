import { useCallback } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export const CAPTCHA_ENABLED = !!import.meta.env.VITE_CAPTCHA_SITE_KEY;

/**
 * Returns a function producing a reCAPTCHA v3 token. Without a configured site key (local
 * development, where the backend runs with CAPTCHA_DISABLED) a placeholder token is used.
 */
export const useCaptcha = () => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    return useCallback(async () => {
        if (!CAPTCHA_ENABLED) return "disabled";

        if (!executeRecaptcha) throw new Error("captcha-unavailable");

        return executeRecaptcha();
    }, [executeRecaptcha]);
};
