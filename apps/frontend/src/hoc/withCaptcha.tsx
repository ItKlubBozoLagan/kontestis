import { FC } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export const withCaptcha =
    <P,>(Component: FC<P>): FC<P> =>
    // eslint-disable-next-line react/display-name
    (properties) =>
        (
            <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_CAPTCHA_SITE_KEY}>
                {/* @ts-ignore idc at this point, fuck IntrinsicAttributes, I'll figure it out later TODO */}
                <Component {...properties} />
            </GoogleReCaptchaProvider>
        );
