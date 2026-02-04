import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { getScoreGradientColor } from "@/lib/score-gradient";

interface ScoreBadgeProperties {
    score: number | null | undefined;
    maxScore: number;
    className?: string;
    showFraction?: boolean;
}

/**
 * A score badge with continuous gradient coloring.
 * Colors interpolate smoothly from red (0%) to green (100%).
 * Rectangular with rounded corners, designed to fill table row height.
 * If score is null/undefined (no submission), shows a neutral gray badge.
 * Adapts colors for dark mode (darker background, lighter text).
 */
export function ScoreBadge({
    score,
    maxScore,
    className = "",
    showFraction = true,
}: ScoreBadgeProperties) {
    const { theme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (theme === "dark") {
            setIsDarkMode(true);
        } else if (theme === "light") {
            setIsDarkMode(false);
        } else {
            // System theme - check media query
            setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
    }, [theme]);

    // Handle "no submission" case (null/undefined) differently from explicit 0
    const hasSubmission = score !== null && score !== undefined;
    const displayScore = hasSubmission ? score : 0;

    // If no submission, use neutral styling
    if (!hasSubmission) {
        return (
            <span
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-semibold min-w-[4rem] bg-muted text-muted-foreground ${className}`}
            >
                {showFraction ? `-/${maxScore}` : "-"}
            </span>
        );
    }

    const colors = getScoreGradientColor(displayScore, maxScore, isDarkMode);

    return (
        <span
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-semibold min-w-[4rem] ${className}`}
            style={{ backgroundColor: colors.bg, color: colors.text }}
        >
            {showFraction ? `${displayScore}/${maxScore}` : displayScore}
        </span>
    );
}
