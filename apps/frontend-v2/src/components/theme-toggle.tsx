import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md", theme === "light" && "bg-background shadow-sm")}
                onClick={() => setTheme("light")}
            >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Light theme</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-md", theme === "dark" && "bg-background shadow-sm")}
                onClick={() => setTheme("dark")}
            >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Dark theme</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-7 w-7 rounded-md",
                    theme === "system" && "bg-background shadow-sm"
                )}
                onClick={() => setTheme("system")}
            >
                <Monitor className="h-4 w-4" />
                <span className="sr-only">System theme</span>
            </Button>
        </div>
    );
}
