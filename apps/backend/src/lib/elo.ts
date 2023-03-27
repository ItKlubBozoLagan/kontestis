export type ContestMemberLeaderboardInfo = {
    currentGlobalElo: number;

    // this field represents the points of all problems
    // assume this is the same length as the number of problems
    problemPoints: number[];
};

const computePlace = (
    userRatings: number[],
    score: number,
) => {

    const expectedPlace = userRatings.reduce((ep = 1, mem) => ep + 1/(1+10**((score-mem)/400)));
    return expectedPlace;
}

const computePerformance = (
    userRatings: number[],
    place: number,
) => {
    var low = 0;
    var high = 10000;
    while (high-low>0.5){
        const mid = low+(high-low)/2;
        if (computePlace(userRatings, mid) < place){
            low = mid;
        }else{
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

    const expectedPlace = userRatings.reduce((ep, mem) => ep + 1/(1+10**((score-mem)/400)), 0);

    const place = userRatings.reduce((p, mem) => p + (mem > score ? 1 : 0) + (mem === score ? 0.5 : 0), 0);

    const newPlace = Math.sqrt(expectedPlace*place);

    const performanceRating = computePerformance(userScores, newPlace);

    const result = Math.round((targetMember.currentGlobalElo-performanceRating)/2)

    return Number.isNaN(result) ? 0 : result;
};
