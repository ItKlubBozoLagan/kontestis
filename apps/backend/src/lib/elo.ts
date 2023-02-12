export type ContestMemberLeaderboardInfo = {
    currentGlobalElo: number;

    // this field represents the points of all problems
    // assume this is the same length as the number of problems
    problemPoints: number[];
};

const computePerformance = (
    userScores: number[],
    userRatings: number[],
    score: number,
    maxScore: number
) => {
    // edge case for when score is 0
    if (score === 0) return 0;

    //function works like weighted arithmetic mean such that

    let sum = 0;
    let weight = 0;

    for (const [index, userScore] of userScores.entries()) {
        if (userScore === 0) continue;

        const ratio = score / userScore;
        const howClose = Math.min(score, userScore) / Math.max(score, userScore);
        const rto = userRatings[index] * ratio * Math.sqrt(ratio) * howClose;

        sum += rto;
        weight += howClose;
    }

    const result = sum / weight;

    if (score === maxScore) {
        return Math.max(result, score);
    }

    return sum / weight;
};

export const computeELODifference = (
    targetMember: ContestMemberLeaderboardInfo,
    problemMaxPoints: number[],
    leaderboard: ContestMemberLeaderboardInfo[] // does not include targetMember
) => {
    const userScores = leaderboard.map((mem) => {
        return mem.problemPoints.reduce((sum, p) => sum + p);
    });

    const userRatings = leaderboard.map((mem) => {
        return mem.currentGlobalElo;
    });

    const maxScore = problemMaxPoints.reduce((sum, p) => sum + p);

    const score = targetMember.problemPoints.reduce((sum, p) => sum + p);

    const performance = computePerformance(userScores, userRatings, score, maxScore);

    const percentage = performance / targetMember.currentGlobalElo;

    return (Math.sqrt(percentage) - 1) * targetMember.currentGlobalElo;
};
