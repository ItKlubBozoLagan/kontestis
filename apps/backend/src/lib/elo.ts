export type ContestMemberLeaderboardInfo = {
    currentGlobalElo: number;

    // this field represents the points of all problems
    // assume this is the same length as the number of problems
    problemPoints: number[];
};

const computePlace = (userRatings: number[], rating: number) => {
    return userRatings.reduce((ep, mem) => ep + 1 / (1 + 10 ** ((mem - rating) / 400)), 1);
};

const computePerformance = (userRatings: number[], place: number) => {
    let low = 0;
    let high = 10_000;

    while (high - low > 0.5) {
        const mid = low + (high - low) / 2;

        if (computePlace(userRatings, mid) > place) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return high;
};

export const computeELODifference = (
    targetMember: ContestMemberLeaderboardInfo,
    problemMaxPoints: number[],
    leaderboard: ContestMemberLeaderboardInfo[] // does not include targetMember
) => {
    if (leaderboard.length === 0) return 0;

    const userScores = leaderboard.map((mem) => mem.problemPoints.reduce((sum, p) => sum + p, 0));

    const userRatings = leaderboard.map((mem) => mem.currentGlobalElo);

    const score = targetMember.problemPoints.reduce((sum, p) => sum + p, 0);
    const currentRating = targetMember.currentGlobalElo;

    const expectedPlace = computePlace(userRatings, currentRating);

    const place = userScores.reduce(
        (p, mem) => p + (mem > score ? 1 : 0) + (mem === score ? 0.5 : 0),
        1
    );

    const newPlace = Math.sqrt(expectedPlace * place);

    const performanceRating = computePerformance(userRatings, newPlace);

    const result = Math.round((performanceRating - currentRating) / 2);

    return Number.isNaN(result) ? 0 : result;
};
