import { X } from "lucide-react";
import { useState } from "react";

import { TagBadge } from "@/components/badges/TagBadge";
import { Input } from "@/components/ui/input";

export const TagInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) => {
    const [draft, setDraft] = useState("");

    const add = () => {
        const tag = draft.trim();

        if (tag && !value.includes(tag)) onChange([...value, tag].sort());

        setDraft("");
    };

    return (
        <div className="flex flex-col gap-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5">
                            <TagBadge tag={tag} />
                            <button
                                type="button"
                                aria-label={`remove ${tag}`}
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => onChange(value.filter((it) => it !== tag))}
                            >
                                <X className="size-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <Input
                value={draft}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={add}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        add();
                    }
                }}
            />
        </div>
    );
};
