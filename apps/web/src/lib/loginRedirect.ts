// `?redirect=` on the login page does not survive logins that leave the site (AAI@EduHr), so it
// is kept in sessionStorage for the round trip.

const KEY = "@kontestis/web/login-redirect";
const MAX_AGE_MS = 10 * 60 * 1000;

const isLocalPath = (path: string) =>
    path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");

export const rememberLoginRedirect = (path: string | null) => {
    try {
        if (path && isLocalPath(path))
            sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
        else sessionStorage.removeItem(KEY);
    } catch {
        // storage unavailable: the user lands on the dashboard instead
    }
};

export const takeLoginRedirect = (): string | null => {
    try {
        const raw = sessionStorage.getItem(KEY);

        if (raw === null) return null;

        sessionStorage.removeItem(KEY);

        const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };

        if (typeof path !== "string" || typeof at !== "number") return null;

        if (Date.now() - at > MAX_AGE_MS || !isLocalPath(path)) return null;

        return path;
    } catch {
        return null;
    }
};
