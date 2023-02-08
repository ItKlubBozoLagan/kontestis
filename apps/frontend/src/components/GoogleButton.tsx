import React from "react";
import { FcGoogle } from "react-icons/all";
import tw from "twin.macro";

export const GoogleButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>((properties, reference) => {
    return (
        <button
            {...properties}
            ref={reference}
            css={[
                tw`w-auto bg-white hover:bg-blue-100/25 border border-solid border-neutral-200`,
                tw`rounded-md px-3 py-2 transition-all cursor-pointer text-base`,
                tw`flex items-center justify-center gap-2`,
            ]}
        >
            <FcGoogle size={24} />
            Sign in with Google
        </button>
    );
});

GoogleButton.displayName = "GoogleButton";
