import { FC } from "react";

import { AaiEduButton } from "../../components/AaiEduButton";
import { useAuthStore } from "../../state/auth";

export const EduDetails: FC = () => {
    const { user } = useAuthStore();

    if (!user.is_edu)
        return (
            <div tw={"w-full flex justify-center mt-6 mb-8"}>
                <AaiEduButton text={"Link"} purpose={"link"} />{" "}
            </div>
        );

    return (
        <div tw={"w-full flex justify-center mt-6 mb-8"}>
            <pre>{JSON.stringify(user.edu_data, null, 2)}</pre>
        </div>
    );
};
