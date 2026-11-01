import type { ExamGradingScale } from "@kontestis/models";

/** Highest grade whose percentage threshold the score reaches (same rounding as before). */
export const gradeFor = (scales: ExamGradingScale[], score: number, maxScore: number) =>
    [...scales]
        .sort((a, b) => b.percentage - a.percentage)
        .find((scale) => score >= Math.floor((scale.percentage / 100) * maxScore))?.grade;
