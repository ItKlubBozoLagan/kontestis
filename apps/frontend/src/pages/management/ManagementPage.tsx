import { FC } from "react";
import { FiPlus } from "react-icons/all";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";

export const ManagementPage: FC = () => {
    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>
                Your contests
                <SimpleButton prependIcon={FiPlus}>Create new</SimpleButton>
            </PageTitle>
        </div>
    );
};
