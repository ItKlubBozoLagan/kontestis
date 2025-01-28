import { theme } from "twin.macro";

export type GlobalRank =
    | "rookie"
    | "apprentice"
    | "journeyman"
    | "proficient"
    | "phenom"
    | "maestro"
    | "prodigy";

const rankColorMap: Record<GlobalRank, string> = {
    rookie: theme`colors.neutral.500`,
    apprentice: theme`colors.green.600`,
    journeyman: theme`colors.cyan.600`,
    proficient: theme`colors.blue.600`,
    phenom: theme`colors.pink.500`,
    maestro: theme`colors.yellow.600`,
    prodigy: theme`colors.red.500`,
};

export const AllRanks = Object.keys(rankColorMap) as (keyof typeof rankColorMap)[];

export const rankFromElo = (elo: number): GlobalRank => {
    if (elo < 800) return "rookie";

    if (elo < 1400) return "apprentice";

    if (elo < 2000) return "journeyman";

    if (elo < 2400) return "proficient";

    if (elo < 2800) return "phenom";

    if (elo < 3200) return "maestro";

    return "prodigy";
};

export const colorFromRank = (rank: GlobalRank) => rankColorMap[rank];

export const minScoreForRank = (rank: GlobalRank) => {
    switch (rank) {
        case "rookie":
            return 0;
        case "apprentice":
            return 800;
        case "journeyman":
            return 1400;
        case "proficient":
            return 2000;
        case "phenom":
            return 2400;
        case "maestro":
            return 2800;
        case "prodigy":
            return 3200;
    }
};

export const nextRankFromRank = (rank: Exclude<GlobalRank, "prodigy">): GlobalRank => {
    switch (rank) {
        case "rookie":
            return "apprentice";
        case "apprentice":
            return "journeyman";
        case "journeyman":
            return "proficient";
        case "proficient":
            return "phenom";
        case "phenom":
            return "maestro";
        case "maestro":
            return "prodigy";
    }
};
