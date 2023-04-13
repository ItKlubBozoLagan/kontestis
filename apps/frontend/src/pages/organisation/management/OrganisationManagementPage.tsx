import React, { FC } from "react";
import { FiArrowLeft } from "react-icons/all";
import { useNavigate, useParams } from "react-router";

import { PageTitle } from "../../../components/PageTitle";
import { Translated } from "../../../components/Translated";
import { useOrganisation } from "../../../hooks/organisation/useOrganisation";
import { useTranslation } from "../../../hooks/useTranslation";
import { OrganisationInfoSection } from "./OrganisationInfoSection";
import { OrganisationMembersSection } from "./OrganisationMembersSection";

type Properties = {
    organisationId: string;
};

export const OrganisationManagementPage: FC = () => {
    const { organisationId } = useParams<Properties>();

    const { data: organisation } = useOrganisation(BigInt(organisationId ?? 0));

    const { t } = useTranslation();

    const navigate = useNavigate();

    return (
        <div tw={"w-full flex flex-col"}>
            <div tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}>
                <div
                    onClick={() => navigate(-1)}
                    tw={"flex gap-2 items-center text-lg cursor-pointer"}
                >
                    <FiArrowLeft size={"16px"} /> {t("organisations.management.backButton")}
                </div>
            </div>
            <PageTitle>
                <Translated translationKey="organisations.management.title">
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
