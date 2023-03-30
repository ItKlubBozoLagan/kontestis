/* eslint-disable no-undef */
import { useEffect } from "react";

export const useWindowEvent = <K extends keyof WindowEventMap>(
    eventName: K,
    listener: (event: WindowEventMap[K]) => any
) => {
    useEffect(() => {
        window.addEventListener(eventName, listener);

        return () => window.removeEventListener(eventName, listener);
    }, []);
};
