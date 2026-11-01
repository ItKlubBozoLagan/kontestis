import { useTranslation } from "react-i18next";

import { RANKS } from "@/lib/rank";

const SCALE_MAX = 3200;

/** All ranks on one bar with a marker at the user's Elo. */
export const RankProgress = ({ elo }: { elo: number }) => {
    const { t } = useTranslation();
    const position = Math.min(1, Math.max(0, elo / SCALE_MAX));

    return (
        <div className="w-full px-4 pt-7 pb-14">
            <div className="relative">
                <div
                    className="absolute -top-6 -translate-x-1/2 text-amber-500 transition-[left]"
                    style={{ left: `${position * 100}%` }}
                    aria-hidden
                >
                    ▼
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                    {RANKS.slice(0, -1).map((rank, index) => (
                        <div
                            key={rank.name}
                            style={{
                                backgroundColor: rank.color,
                                width: `${((RANKS[index + 1].min - rank.min) / SCALE_MAX) * 100}%`,
                            }}
                        />
                    ))}
                </div>
                {RANKS.map((rank) => (
                    <div
                        key={rank.name}
                        className="absolute top-1 flex -translate-x-1/2 flex-col items-center"
                        style={{ left: `${(rank.min / SCALE_MAX) * 100}%` }}
                    >
                        <div
                            className="border-background -mt-2 size-3.5 rounded-full border-2"
                            style={{ backgroundColor: rank.color }}
                        />
                        <span className="mt-1 font-mono text-[11px] tabular-nums">{rank.min}</span>
                        <span className="text-muted-foreground hidden text-[11px] sm:block">
                            {t(`ranks.${rank.name}`)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
