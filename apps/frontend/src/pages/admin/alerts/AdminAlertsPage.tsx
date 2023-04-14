import { zodResolver } from "@hookform/resolvers/zod/dist/zod";
import { AdminPermissions } from "@kontestis/models";
import { toCroatianLocale } from "@kontestis/utils";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CanAdmin } from "../../../components/CanAdmin";
import { SimpleButton } from "../../../components/SimpleButton";
import { useCreateAlert } from "../../../hooks/notifications/useCreateAlert";
import { useSiteAlerts } from "../../../hooks/useSiteAlerts";
import { useTranslation } from "../../../hooks/useTranslation";

const AlertSchema = z.object({
    message: z.string(),
});

export const AdminAlertsPage: FC = () => {
    const alerts = useSiteAlerts();

    const { register, handleSubmit, reset } = useForm<z.infer<typeof AlertSchema>>({
        resolver: zodResolver(AlertSchema),
        defaultValues: {
            message: "",
        },
    });

    const createMutation = useCreateAlert();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate(data);
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        reset();
    }, [createMutation.isSuccess]);

    const { t } = useTranslation();

    return (
        <div tw={"flex gap-2 w-full justify-center"}>
            <div tw={"flex flex-col items-center gap-6 w-full"}>
                <CanAdmin permission={AdminPermissions.ADD_ALERTS}>
                    <form onSubmit={onSubmit}>
                        <div tw={"flex flex-col gap-2 w-96"}>
                            <label htmlFor={"message"}>{t("admin.overview.alerts.label")}</label>
                            <textarea
                                {...register("message")}
                                tw={"resize-y min-h-[8rem] text-base"}
                            />
                            <SimpleButton tw={"mt-2"}>
                                {t("admin.overview.alerts.pushButton")}
                            </SimpleButton>
                        </div>
                    </form>
                </CanAdmin>
                <div tw={"w-full flex flex-wrap justify-center gap-4"}>
                    {alerts.map((alert) => (
                        <div
                            tw={
                                "bg-white p-2 w-full border border-solid border-black w-56 text-base whitespace-pre-line flex flex-col"
                            }
                            key={alert.id.toString()}
                        >
                            <span tw={"text-neutral-600 text-sm select-none"}>
                                {toCroatianLocale(alert.created_at)}
                            </span>
                            {alert.data}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
