import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AuthBrand = () => (
    <img src="/evaluatorLogo.png" alt="Kontestis Evaluator" className="size-36 dark:invert-[.9]" />
);

export const AuthCard = ({
    title,
    description,
    children,
    footer,
}: {
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}) => (
    <div className="flex w-full flex-col items-center gap-6">
        <div className="fixed top-4 right-4">
            <LanguageSwitcher />
        </div>
        <AuthBrand />
        <Card className="w-full">
            <CardHeader className="border-b text-center">
                <CardTitle className="text-xl">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-2">{children}</CardContent>
        </Card>
        {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
    </div>
);
