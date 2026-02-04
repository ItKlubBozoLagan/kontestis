/**
 * Get score gradient color based on percentage with continuous HSL interpolation.
 * Color stops: red(0%) -> orange(40%) -> yellow(60%) -> lime(80%) -> green(100%)
 * Returns semi-transparent background and text colors for both light and dark modes.
 */
export function getScoreGradientColor(
    score: number,
    maxScore: number,
    isDarkMode: boolean = false
): { bg: string; text: string } {
    if (maxScore === 0) {
        return isDarkMode
            ? { bg: "rgba(55, 65, 81, 0.6)", text: "rgb(209, 213, 219)" } // gray-700, gray-300
            : { bg: "rgba(229, 231, 235, 0.6)", text: "rgb(55, 65, 81)" }; // gray-200, gray-700
    }

    const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));

    // Color stops using HSL for smooth interpolation
    const colorStops = [
        { pct: 0, h: 0, s: 84, l: 60 }, // red-500
        { pct: 40, h: 25, s: 95, l: 53 }, // orange-500
        { pct: 60, h: 48, s: 96, l: 53 }, // yellow-500
        { pct: 80, h: 84, s: 81, l: 44 }, // lime-500
        { pct: 100, h: 142, s: 71, l: 45 }, // green-500
    ];

    // Find the two color stops to interpolate between
    let lower = colorStops[0];
    let upper = colorStops[colorStops.length - 1];

    for (let index = 0; index < colorStops.length - 1; index++) {
        if (percentage >= colorStops[index].pct && percentage <= colorStops[index + 1].pct) {
            lower = colorStops[index];
            upper = colorStops[index + 1];
            break;
        }
    }

    // Interpolate
    const range = upper.pct - lower.pct;
    const factor = range === 0 ? 0 : (percentage - lower.pct) / range;

    const h = Math.round(lower.h + (upper.h - lower.h) * factor);
    const s = Math.round(lower.s + (upper.s - lower.s) * factor);
    const l = Math.round(lower.l + (upper.l - lower.l) * factor);

    if (isDarkMode) {
        // Dark mode: darker background (reduce lightness, lower opacity), lighter text
        const darkBgL = Math.max(l - 15, 20);
        const bgColor = `hsla(${h}, ${s}%, ${darkBgL}%, 0.5)`;

        // Lighter text color - increase lightness for better contrast on dark bg
        const textL = Math.min(l + 25, 90);
        const textColor = `hsl(${h}, ${s}%, ${textL}%)`;

        return { bg: bgColor, text: textColor };
    } else {
        // Light mode: semi-transparent background (0.7 opacity), darker text
        const bgColor = `hsla(${h}, ${s}%, ${l}%, 0.7)`;

        // Darker text color - reduce lightness by 25% for better contrast
        const textL = Math.max(l - 25, 15);
        const textColor = `hsl(${h}, ${s}%, ${textL}%)`;

        return { bg: bgColor, text: textColor };
    }
}
