import { toCroatianLocale } from "@kontestis/utils";
import React, { FC } from "react";
import tw from "twin.macro";

import { AaiEduButton } from "../../components/AaiEduButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";

export const EduDetails: FC = () => {
    const { user } = useAuthStore();

    const { t } = useTranslation();

    if (!user.is_edu)
        return (
            <div tw={"w-full flex justify-center mt-6 mb-8"}>
                <AaiEduButton purpose={"link"} />
            </div>
        );

    const eduUser = user.edu_data;

    return (
        <div tw={"w-full px-12 pt-6 pb-12"}>
            <TitledSection
                parentStyle={tw`w-full flex flex-col gap-4`}
                title={t("account.aaiedu.title")}
            >
                <div tw={"w-full grid grid-cols-2 justify-center items-center gap-4 mb-4"}>
                    <TitledInput
                        tw={"m-auto"}
                        label={t("account.aaiedu.userId")}
                        value={eduUser.uid}
                        readOnly
                    />
                    <TitledInput
                        tw={"m-auto"}
                        label={t("account.aaiedu.fullName")}
                        value={eduUser.full_name}
                        readOnly
                    />
                    <TitledInput
                        tw={"m-auto"}
                        label={t("account.aaiedu.email")}
                        value={eduUser.email}
                        readOnly
                    />
                    <TitledInput
                        tw={"m-auto"}
                        label={t("account.aaiedu.associatedOrg")}
                        value={eduUser.associated_org}
                        readOnly
                    />
                    {eduUser.dob && (
                        <TitledInput
                            tw={"m-auto"}
                            label={t("account.aaiedu.dob")}
                            value={toCroatianLocale(eduUser.dob)}
                            readOnly
                        />
                    )}
                    {eduUser.student_category && (
                        <TitledInput
                            tw={"m-auto"}
                            label={t("account.aaiedu.studentCategory")}
                            value={eduUser.student_category}
                            readOnly
                        />
                    )}
                    {eduUser.professional_status && (
                        <TitledInput
                            tw={"m-auto"}
                            label={t("account.aaiedu.professionalStatus")}
                            value={eduUser.professional_status}
                            readOnly
                        />
                    )}
                </div>
            </TitledSection>
        </div>
    );
};
