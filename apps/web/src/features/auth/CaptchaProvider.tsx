import type { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

import { CAPTCHA_ENABLED } from "@/hooks/useCaptcha";

export const CaptchaProvider = ({ children }: { children: ReactNode }) =>
    CAPTCHA_ENABLED ? (
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_CAPTCHA_SITE_KEY!}>
            {children}
        </GoogleReCaptchaProvider>
    ) : (
        children
    );
