import { FC } from "react";
import { useNavigate } from "react-router";

import { SimpleButton } from "../../../components/SimpleButton";
import { useTranslation } from "../../../hooks/useTranslation";

export const AdminContestsPage: FC = () => {
    const navigate = useNavigate();

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col items-center gap-4"}>
            <span tw={"text-lg"}>{t("admin.overview.contests.message")}</span>
            <SimpleButton onClick={() => navigate("/management")}>
                {t("admin.overview.contests.goToMangement")}
            </SimpleButton>
        </div>
    );
};
