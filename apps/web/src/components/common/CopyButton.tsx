import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const CopyButton = ({ value, label }: { value: string; label?: string }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeout = setTimeout(() => setCopied(false), 1500);

        return () => clearTimeout(timeout);
    }, [copied]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size={label ? "sm" : "icon"}
                    className={label ? undefined : "size-8"}
                    onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
                >
                    {copied ? <Check className="text-green-600" /> : <Copy />}
                    {label}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? t("common.copied") : t("common.copy")}</TooltipContent>
        </Tooltip>
    );
};
