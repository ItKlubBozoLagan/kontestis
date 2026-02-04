import { useCallback, useEffect, useState } from "react";

/**
 * Hook to copy text to clipboard with feedback
 */
export function useCopy(duration = 2000) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), duration);

            return () => clearTimeout(timer);
        }
    }, [copied, duration]);

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            return true;
        } catch {
            return false;
        }
    }, []);

    return { copied, copy };
}
