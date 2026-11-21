// Remembers an external application's authorization request across a login that leaves the
//  site (AAI@Edu), where the `afterLogin` query parameter does not survive the round trip.

const KEY = "@kontestis/oauth-return";
const MAX_AGE_MS = 10 * 60 * 1000;

export const OAUTH_AUTHORIZE_PATH = "/oauth/authorize";

export const rememberOAuthReturn = (path: string) => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
    } catch {
        // storage unavailable, the `afterLogin` parameter still covers same-site logins
    }
};

export const takeOAuthReturn = (): string | null => {
    try {
        const raw = sessionStorage.getItem(KEY);

        if (raw === null) return null;

        sessionStorage.removeItem(KEY);

        const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };

        if (typeof path !== "string" || typeof at !== "number") return null;

        if (Date.now() - at > MAX_AGE_MS) return null;

        return path.startsWith(OAUTH_AUTHORIZE_PATH + "?") ? path : null;
    } catch {
        return null;
    }
};
