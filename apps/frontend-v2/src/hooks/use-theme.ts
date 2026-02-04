import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("theme") as Theme) || "system";
        }

        return "system";
    });

    useEffect(() => {
        const root = document.documentElement;
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

        const applyTheme = () => {
            if (theme === "dark") {
                root.classList.add("dark");
            } else if (theme === "light") {
                root.classList.remove("dark");
            } else {
                if (systemDark.matches) {
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }
        };

        applyTheme();
        localStorage.setItem("theme", theme);

        const handleChange = () => {
            if (theme === "system") {
                applyTheme();
            }
        };

        systemDark.addEventListener("change", handleChange);

        return () => systemDark.removeEventListener("change", handleChange);
    }, [theme]);

    return { theme, setTheme };
}
