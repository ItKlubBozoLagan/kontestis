import { FC } from "react";

import { useAuthStore } from "../../state/auth";
import { capitalize } from "../../utils/text";

export const Account: FC = () => {
    const { user } = useAuthStore();

    return (
        <div tw={"flex flex-col gap-2 py-10"}>
            {Object.entries(user).map(([field, value]) => (
                <div key={field} tw={"flex gap-2 text-lg"}>
                    <span tw={"font-bold"}>{capitalize(field)}: </span>
                    <span tw={"font-mono"}>{value.toString()}</span>
                </div>
            ))}
        </div>
    );
};
