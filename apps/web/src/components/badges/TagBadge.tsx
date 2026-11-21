import { textToHexColor } from "@kontestis/utils";

import { RankBadge } from "@/components/badges/RankBadge";

/** Problem tag; `*1400` style tags are rendered as a difficulty rank. */
export const TagBadge = ({ tag }: { tag: string }) => {
    if (/^\*\d+$/.test(tag)) return <RankBadge elo={Number(tag.slice(1))} label={tag} />;

    const color = textToHexColor(tag);

    return (
        <span
            className="inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium text-neutral-900"
            style={{ backgroundColor: color, borderColor: color }}
        >
            {tag}
        </span>
    );
};
