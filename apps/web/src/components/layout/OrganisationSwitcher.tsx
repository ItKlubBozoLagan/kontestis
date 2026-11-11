import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, List } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { organisationQueries } from "@/api/organisations";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrganisationStore } from "@/stores/organisation";

/** Show the search box once the list is too long to scan. */
const SEARCH_THRESHOLD = 8;

export const OrganisationSwitcher = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { organisationId, select, clear } = useOrganisationStore();
    const { data: organisations = [] } = useQuery(organisationQueries.all());

    const current = organisations.find((it) => it.id.toString() === organisationId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="max-w-48 gap-1.5"
                    aria-label={t("nav.switchOrganisation")}
                >
                    <Building2 />
                    <span className="truncate">{current?.name ?? "…"}</span>
                    <ChevronsUpDown className="opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
                <Command>
                    {organisations.length > SEARCH_THRESHOLD && (
                        <CommandInput placeholder={t("nav.searchOrganisations")} />
                    )}
                    <CommandList className="max-h-80">
                        <CommandEmpty>{t("nav.noOrganisations")}</CommandEmpty>
                        <CommandGroup heading={t("nav.switchOrganisation")}>
                            {organisations.map((organisation) => (
                                <CommandItem
                                    key={organisation.id.toString()}
                                    value={`${organisation.name} ${organisation.id}`}
                                    onSelect={() => {
                                        select(organisation.id);
                                        setOpen(false);
                                        navigate("/");
                                    }}
                                >
                                    <span className="truncate">{organisation.name}</span>
                                    {organisation.id.toString() === organisationId && (
                                        <Check className="ml-auto" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup forceMount>
                            <CommandItem
                                value="__manage_organisations"
                                forceMount
                                onSelect={() => {
                                    clear();
                                    setOpen(false);
                                    navigate("/organisations");
                                }}
                            >
                                <List />
                                {t("nav.manageOrganisations")}
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
