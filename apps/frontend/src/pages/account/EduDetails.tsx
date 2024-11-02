import { toCroatianLocale } from "@kontestis/utils";
import React, { FC, useMemo } from "react";
import tw from "twin.macro";

import { AaiEduButton } from "../../components/AaiEduButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

export const EduDetails: FC = () => {
    const { user } = useAuthStore();

    if (!user.is_edu)
        return (
            <div tw={"w-full flex justify-center mt-6 mb-8"}>
                <AaiEduButton text={"Link"} purpose={"link"} />{" "}
            </div>
        );

    const eduUser = useMemo(() => user.edu_data, [user]);

    return (
        <div tw={"w-full px-12 pt-6 pb-12"}>
            <TitledSection
                parentStyle={tw`w-full flex flex-col gap-4`}
                title={"Linked AAI@Edu account"}
            >
                {/* TODO: relja*/}
                <div tw={"w-full grid grid-cols-2 justify-center items-center gap-4 mb-4"}>
                    <TitledInput tw={"m-auto"} label={"User ID:"} value={eduUser.uid} readOnly />
                    <TitledInput
                        tw={"m-auto"}
                        label={"Full name:"}
                        value={eduUser.full_name}
                        readOnly
                    />
                    <TitledInput
                        tw={"m-auto"}
                        label={"Electronic mail address:"}
                        value={eduUser.email}
                        readOnly
                    />
                    <TitledInput
                        tw={"m-auto"}
                        label={"Associated organisation:"}
                        value={eduUser.associated_org}
                        readOnly
                    />
                    {eduUser.dob && (
                        <TitledInput
                            tw={"m-auto"}
                            label={"Date of birth:"}
                            value={toCroatianLocale(eduUser.dob)}
                            readOnly
                        />
                    )}
                    {eduUser.student_category && (
                        <TitledInput
                            tw={"m-auto"}
                            label={"Student category:"}
                            value={eduUser.student_category}
                            readOnly
                        />
                    )}
                    {eduUser.professional_status && (
                        <TitledInput
                            tw={"m-auto"}
                            label={"Professional status:"}
                            value={eduUser.professional_status}
                            readOnly
                        />
                    )}
                </div>
            </TitledSection>
        </div>
    );
};
