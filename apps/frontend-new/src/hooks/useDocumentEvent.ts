/* eslint-disable no-undef */
import { useEffect } from "react";

export const useDocumentEvent = <K extends keyof DocumentEventMap>(
    eventName: K,
    listener: (event: DocumentEventMap[K]) => any
) => {
    useEffect(() => {
        document.addEventListener(eventName, listener);

        return () => document.removeEventListener(eventName, listener);
    }, []);
};
