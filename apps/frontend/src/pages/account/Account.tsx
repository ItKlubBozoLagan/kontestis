import md5 from "md5";
import { FC } from "react";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

export const Account: FC = () => {
    const { user } = useAuthStore();

    return (
        <div tw={"w-full md:w-4/5 flex flex-col gap-2 py-10"}>
            <TitledSection title={"Account"}>
                <div tw={"w-full flex items-center justify-between px-10"}>
                    <div tw={"flex flex-col justify-start gap-2 font-mono"}>
                        <img
                            tw={"w-64 h-64 rounded-full"}
                            src={`https://www.gravatar.com/avatar/${md5(
                                user.email.trim().toLowerCase()
                            )}`}
                            alt={"Profile avatar"}
                        />
                        <span tw={"text-[10px]"}>
                            Image provided by{" "}
                            <a href={"https://en.gravatar.com/"}>Gravatar</a>!
                        </span>
                    </div>
                    <div tw={"flex flex-col justify-between gap-y-2 font-mono"}>
                        <TitledInput title={"Name:"} value={user.username} />
                        <TitledInput title={"Email:"} value={user.email} />
                        <TitledInput title={"New Password:"} value={""} />
                        <TitledInput title={"Confirm Password:"} value={""} />
                        <TitledInput title={"Current Password:"} value={""} />
                        <SimpleButton>Update details!</SimpleButton>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};
