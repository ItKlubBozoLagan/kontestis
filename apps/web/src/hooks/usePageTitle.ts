import { useEffect } from "react";

const BASE_TITLE = "Kontestis";

/** Sets `document.title` to "<title> · Kontestis" while mounted. */
export const usePageTitle = (title?: string) => {
    useEffect(() => {
        document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;

        return () => {
            document.title = BASE_TITLE;
        };
    }, [title]);
};
