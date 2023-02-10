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
const computePerformance = (    
    userScores: number[],
    userRatings: number[],
    score: number,
    maxScore: number
) => {
    // edge case for when score is 0
    if (score === 0)return 0; 
    
    const siz = userScores.length;
    
    //function works like weighted arithmetic mean such that 

    let sum = 0;
    let weight = 0;

    for (let i = 0; i < siz; ++i){
        if (userScores[i] === 0)continue;
        const ratio = score/userScores[i]
        const howClose = Math.min(score, userScores[i])/Math.max(score, userScores[i]);
        const rto = userRatings[i]*ratio*Math.sqrt(ratio)*howClose;
        sum += rto;
        weight += howClose;
    }

    const result = sum/weight;

    if (score === maxScore){
        return Math.max(result, score);
    }
    return sum/weight;
}

export const computeELODifference = (
    targetMember: ContestMemberLeaderboardInfo,
    problems: ProblemInfo,
    leaderboard: ContestMemberLeaderboardInfo[] // does not include targetMember
) => {
    const userScores = leaderboard.map((mem) => {
        return mem.problemPoints.reduce((sum, p) => (sum+p))
    })
    
    const userRatings = leaderboard.map((mem) => {
        return mem.currentGlobalElo;
    })

    const maxScore = problems.maxPoints.reduce((sum, p) => sum+p);

    const score = targetMember.problemPoints.reduce((sum, p) => (sum+p))
    const totalPoints = problems.maxPoints.reduce((sum, p) => (sum+p));
    
    const perf = computePerformance(userScores, userRatings, score, maxScore);

    const perc = perf/targetMember.currentGlobalElo;

    return (Math.sqrt(perc)-1)*targetMember.currentGlobalElo;
};