import { AdminPermissions, hasAdminPermission, Organisation } from "@kontestis/models";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/all";

import { ContestJoinButton } from "../../components/ContestJoinButton";
import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useSelfOrganisationMembers } from "../../hooks/organisation/useSelfOrganisationMembers";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { useOrganisationStore } from "../../state/organisation";
import { useTokenStore } from "../../state/token";
import { CreateOrganisationModal } from "./CreateOrganisationModal";
import { OrganisationTable } from "./OrganisationsTable";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId, skipOrganisationSelect, setSkipOrganisationSelect } =
        useOrganisationStore();
    const { setToken } = useTokenStore();
    const { user } = useAuthStore();

    const { data: organisations } = useAllOrganisations();

    const { data: selfMembers } = useSelfOrganisationMembers();

    const shouldSeeOwnOrganisations = hasAdminPermission(
        user.permissions,
        AdminPermissions.EDIT_ORGANISATIONS
    );

    const ownOrganisations = useMemo(
        () =>
            !shouldSeeOwnOrganisations || !organisations || !selfMembers
                ? []
                : organisations.filter((it) =>
                      selfMembers.some((mem) => mem.organisation_id === it.id)
                  ),
        [selfMembers, organisations, user]
    );

    const organisationClick = useCallback(
        (organisation: Organisation) => {
            setIsSelected(true);
            setOrganisationId(organisation.id);
            setSkipOrganisationSelect(false);
        },
        [setIsSelected, setOrganisationId, setSkipOrganisationSelect]
    );

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
                <ContestJoinButton />
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    {t("organisations.page.createButton")}
                </SimpleButton>
            </div>
            <CreateOrganisationModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />

            {shouldSeeOwnOrganisations && organisations ? (
                <div tw={"w-full flex flex-col gap-8 mt-4"}>
                    <div tw={"w-full flex flex-col gap-4"}>
                        <span tw={"text-xl"}>Organisations you&apos;re a member of</span>
                        <OrganisationTable
                            organisations={ownOrganisations}
                            onClick={organisationClick}
                        />
                    </div>
                    <div tw={"w-full flex flex-col gap-4"}>
                        <span tw={"text-xl"}>All organisations</span>
                        <OrganisationTable
                            organisations={organisations}
                            onClick={organisationClick}
                        />
                    </div>
                </div>
            ) : (
                organisations && (
                    <OrganisationTable organisations={organisations} onClick={organisationClick} />
                )
            )}

            <SimpleButton type={"button"} onClick={() => setToken("")}>
                {t("login.logout")}
            </SimpleButton>
        </div>
    );
};
