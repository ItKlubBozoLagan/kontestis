import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { CreateContestModal } from "./CreateContestModal";

export const ManagementPage: FC = () => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>
                Your contests
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    Create new
                </SimpleButton>
            </PageTitle>
            <CreateContestModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} />
        </div>
    );
};
