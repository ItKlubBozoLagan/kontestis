import { FC } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export const LoginPage: FC = () => {
    const { t } = useTranslation();

    return (
        <div>
            <form action="#">
                <Button onClick={() => console.log("click")}>{t("login.label")}</Button>
            </form>
        </div>
    );
};
