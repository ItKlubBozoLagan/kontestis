import React, { FC } from "react";

import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

export const Account: FC = () => {
    const { user } = useAuthStore();

    return (
        <div tw={"w-full md:w-4/5 flex flex-col gap-2 py-10"}>
            <TitledSection title={"Account information"}>
                <div tw={"w-full flex items-center justify-center gap-10 p-10"}>
                    <div tw={"flex flex-col justify-start gap-2 font-mono"}>
                        <img
                            tw={"w-32 w-32 rounded-full"}
                            src={user.picture_url}
                            alt={"Profile avatar"}
                        />
                    </div>
                    <div>
                        <div
                            tw={
                                "flex flex-col justify-between gap-y-2 font-mono"
                            }
                        >
                            <TitledInput
                                name={"Username"}
                                value={user.full_name}
                                readOnly
                            />
                            <TitledInput
                                name={"E-mail"}
                                value={user.email}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
