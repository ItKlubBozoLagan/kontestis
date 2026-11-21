// The theme provider recommended by shadcn/ui for Vite apps (https://ui.shadcn.com/docs/dark-mode/vite)
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
    useSyncExternalStore,
} from "react";

export type Theme = "dark" | "light" | "system";

type ThemeState = {
    theme: Theme;
    resolvedTheme: "dark" | "light";
    setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "@kontestis/web/theme";

const ThemeContext = createContext<ThemeState | null>(null);

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const useSystemDark = () =>
    useSyncExternalStore(
        (listener) => {
            const query = darkQuery();

            query.addEventListener("change", listener);

            return () => query.removeEventListener("change", listener);
        },
        () => darkQuery().matches
    );

export const ThemeProvider = ({
    children,
    defaultTheme = "light",
}: {
    children: ReactNode;
    defaultTheme?: Theme;
}) => {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme
    );
    const systemDark = useSystemDark();
    const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");
        root.classList.add(resolvedTheme);
        root.style.colorScheme = resolvedTheme;
    }, [resolvedTheme]);

    const setTheme = (next: Theme) => {
        localStorage.setItem(STORAGE_KEY, next);
        setThemeState(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
