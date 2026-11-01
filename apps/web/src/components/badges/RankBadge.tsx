import { useTranslation } from "react-i18next";

import { rankFromElo } from "@/lib/rank";
import { cn } from "@/lib/utils";

export const RankBadge = ({
    elo,
    label,
    showElo = false,
    className,
}: {
    elo: number;
    label?: string;
    showElo?: boolean;
    className?: string;
}) => {
    const { t } = useTranslation();
    const rank = rankFromElo(elo);

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-xs font-semibold text-white",
                className
            )}
            style={{ backgroundColor: rank.color }}
        >
            {label ?? t(`ranks.${rank.name}`)}
            {showElo && <span className="opacity-80">({elo})</span>}
        </span>
    );
};
