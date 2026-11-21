export const RANKS = [
    { name: "rookie", min: 0, color: "#737373" },
    { name: "apprentice", min: 800, color: "#65c53a" },
    { name: "journeyman", min: 1400, color: "#0891b2" },
    { name: "proficient", min: 2000, color: "#2563eb" },
    { name: "phenom", min: 2400, color: "#ec4899" },
    { name: "maestro", min: 2800, color: "#ca8a04" },
    { name: "prodigy", min: 3200, color: "#ef4444" },
] as const;

export type Rank = (typeof RANKS)[number]["name"];

export const rankFromElo = (elo: number) =>
    [...RANKS].reverse().find((rank) => elo >= rank.min) ?? RANKS[0];

export const nextRank = (elo: number) => RANKS.find((rank) => rank.min > elo);
