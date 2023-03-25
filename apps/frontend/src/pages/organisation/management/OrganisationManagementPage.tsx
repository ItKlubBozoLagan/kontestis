import React, { FC } from "react";
import { FiArrowLeft } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { PageTitle } from "../../../components/PageTitle";
import { useOrganisation } from "../../../hooks/organisation/useOrganisation";
import { OrganisationInfoSection } from "./OrganisationInfoSection";
import { OrganisationMembersSection } from "./OrganisationMemebersSection";

type Properties = {
    organisationId: string;
};

export const OrganisationManagementPage: FC = () => {
    const { organisationId } = useParams<Properties>();

    const { data: organisation } = useOrganisation(BigInt(organisationId ?? 0));

    return (
        <div tw={"w-full flex flex-col"}>
            <div tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}>
                <Link to={"/"} tw={"flex items-center"}>
                    <FiArrowLeft size={"16px"} /> Back
                </Link>
            </div>
            <PageTitle>Manage organisation {organisation?.name ?? ""}</PageTitle>
            {organisation && (
                <div tw={"w-1/2 self-center"}>
                    <OrganisationInfoSection organisation={organisation} />
                </div>
            )}
            {organisation && <OrganisationMembersSection organisation={organisation} />}
        </div>
    );
};
