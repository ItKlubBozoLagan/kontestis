import { useCallback, useEffect, useState } from "react";

export const useCopy = () => {
    const [copied, setCopied] = useState(false);
    const [copyTimeout, setCopyTimeout] = useState<ReturnType<typeof setTimeout>>();

    const copy = useCallback((data: string) => {
        if (!("clipboard" in navigator)) return;

        navigator.clipboard.writeText(data);

        if (copyTimeout) clearTimeout(copyTimeout);

        setCopied(true);
        setCopyTimeout(setTimeout(() => setCopied(false), 2000));
    }, []);

    useEffect(() => {
        return () => copyTimeout && clearTimeout(copyTimeout);
    }, []);

    return { copy, copied };
};
