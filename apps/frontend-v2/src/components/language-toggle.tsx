import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
    const { currentLanguage, setLanguage } = useLanguage();

    return (
        <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-7 px-2 rounded-md text-xs font-medium",
                    currentLanguage === "en" && "bg-background shadow-sm"
                )}
                onClick={() => setLanguage("en")}
            >
                EN
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-7 px-2 rounded-md text-xs font-medium",
                    currentLanguage === "hr" && "bg-background shadow-sm"
                )}
                onClick={() => setLanguage("hr")}
            >
                HR
            </Button>
        </div>
    );
}
