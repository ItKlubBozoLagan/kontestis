import { FC, useEffect, useState } from "react";
import { FiPlus } from "react-icons/all";

import { ContestInvite } from "../../components/ContestInvite";
import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useTranslation } from "../../hooks/useTranslation";
import { useOrganisationStore } from "../../state/organisation";
import { useTokenStore } from "../../state/token";
import { CreateOrganisationModal } from "./CreateOrganisationModal";
import { OrganisationTable } from "./OrganisationsTable";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId, skipOrganisationSelect, setSkipOrganisationSelect } =
        useOrganisationStore();
    const { setToken } = useTokenStore();

    const { data: organisations } = useAllOrganisations();

    useEffect(() => {
        if (!skipOrganisationSelect || (organisations ?? []).length !== 1) return;

        setIsSelected(true);
        setSkipOrganisationSelect(false);
        setOrganisationId(organisations![0].id);
    }, [organisations]);

    const [modalOpen, setModalOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col items-end gap-4"}>
            <PageTitle>{t("organisations.page.title")}</PageTitle>
            <div tw={"w-full flex justify-between items-center gap-4"}>
                <ContestInvite />
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    {t("organisations.page.createButton")}
                </SimpleButton>
            </div>
            <CreateOrganisationModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />
            {organisations && (
                <OrganisationTable
                    organisations={organisations}
                    onClick={(organisation) => {
                        setIsSelected(true);
                        setOrganisationId(organisation.id);
                        setSkipOrganisationSelect(false);
                    }}
                />
            )}
            <SimpleButton type={"button"} onClick={() => setToken("")}>
                {t("login.logout")}
            </SimpleButton>
        </div>
    );
};
