import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { organisationQueries } from "@/api/organisations";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganisationStore } from "@/stores/organisation";

export const OrganisationSwitcher = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { organisationId, select, clear } = useOrganisationStore();
    const { data: organisations = [] } = useQuery(organisationQueries.all());

    const current = organisations.find((it) => it.id.toString() === organisationId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-w-48 gap-1.5">
                    <Building2 />
                    <span className="truncate">{current?.name ?? "…"}</span>
                    <ChevronsUpDown className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 w-64 overflow-y-auto">
                <DropdownMenuLabel>{t("nav.switchOrganisation")}</DropdownMenuLabel>
                {organisations.slice(0, 15).map((organisation) => (
                    <DropdownMenuItem
                        key={organisation.id.toString()}
                        onSelect={() => {
                            select(organisation.id);
                            navigate("/");
                        }}
                    >
                        <span className="truncate">{organisation.name}</span>
                        {organisation.id.toString() === organisationId && (
                            <Check className="ml-auto" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={() => {
                        clear();
                        navigate("/organisations");
                    }}
                >
                    <List />
                    {t("nav.manageOrganisations")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
