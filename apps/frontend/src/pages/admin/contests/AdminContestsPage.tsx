import { FC } from "react";
import { useNavigate } from "react-router";

import { SimpleButton } from "../../../components/SimpleButton";

export const AdminContestsPage: FC = () => {
    const navigate = useNavigate();

    return (
        <div tw={"w-full flex flex-col items-center gap-4"}>
            <span tw={"text-lg"}>Admin can manage contests in the management page</span>
            <SimpleButton onClick={() => navigate("/management")}>Go to management</SimpleButton>
        </div>
    );
};
