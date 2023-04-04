import React, { FC } from "react";
import { FiArrowLeft } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { PageTitle } from "../../../components/PageTitle";
import { Translated } from "../../../components/Translated";
import { useOrganisation } from "../../../hooks/organisation/useOrganisation";
import { useTranslation } from "../../../hooks/useTranslation";
import { OrganisationInfoSection } from "./OrganisationInfoSection";
import { OrganisationMembersSection } from "./OrganisationMemebersSection";

type Properties = {
    organisationId: string;
};

export const OrganisationManagementPage: FC = () => {
    const { organisationId } = useParams<Properties>();

    const { data: organisation } = useOrganisation(BigInt(organisationId ?? 0));

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col"}>
            <div tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}>
                <Link to={"/"} tw={"flex gap-2 items-center text-lg"}>
                    <FiArrowLeft size={"16px"} /> {t("ogranisations.menagement.backButton")}
                </Link>
            </div>
            <PageTitle>
                <Translated translationKey="ogranisations.menagement.title">
                    {organisation?.name ?? ""}
                </Translated>
            </PageTitle>
            {organisation && (
                <div tw={"w-1/2 self-center"}>
                    <OrganisationInfoSection organisation={organisation} />
                </div>
            )}
            {organisation && <OrganisationMembersSection organisation={organisation} />}
        </div>
    );
};
