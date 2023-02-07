type ContestMemberLeaderboardInfo = {
    currentGlobalElo: number;

    // this field represents the points of all problems
    // assume this is the same length as the `count` of problems
    problemPoints: number[];
};

type ProblemInfo = {
    count: number;

    // array of max points for `count` problems
    // assume this array is always `count` long
    maxPoints: number[];
};

// will return a number that will be added to users current ELO

// first parameter is the target user for whom the ELO should be computed
// second parameter is all the other contest member scores on the leaderboard
export const computeELODifference = (
    targetMember: ContestMemberLeaderboardInfo,
    problems: ProblemInfo,
    leaderboard: ContestMemberLeaderboardInfo[] // does not include targetMember
) => {
    return 0;
};
