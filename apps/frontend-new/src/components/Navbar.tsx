import { cutText } from "@kontestis/utils";
import { Check, ChevronsUpDown, Users, Wrench } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "/favicon_light.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAllOrganisations } from "@/hooks/organisation/useAllOrganisations";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/state/auth";

const DEFAULT_ORGANISATION_ID = 1n;

export const Navbar: FC = () => {
    const { user } = useAuthStore();

    const navigate = useNavigate();

    const organisations = useAllOrganisations();

    // TODO: temp
    const [selectedOrganisation, setSelectedOrganisation] = useState<bigint>(1n);

    const [organisationSelectOpen, setOrganisationSelectOpen] = useState(false);

    const updateOrganisationByName = useCallback(
        (name: string) => {
            if (!organisations.data) return;

            setSelectedOrganisation(organisations.data.find((it) => it.name === name)?.id ?? 1n);
        },
        [organisations, setSelectedOrganisation]
    );

    // @ts-ignore
    return (
        <nav
            className={
                "w-full px-4 py-3 dark:bg-slate-900 border-0 border-b border-solid dark:border-slate-800 flex justify-center"
            }
        >
            <div className={"flex items-center justify-between w-full max-w-screen-xl"}>
                <div className={"flex gap-6 items-center"}>
                    <div className={"flex items-center gap-4"}>
                        <img src={logo} alt={"Kontestis logo"} className={"h-8 w-auto"} />
                        <h1 className={"text-lg"}>Kontestis</h1>
                    </div>
                    <div className={"flex gap-4 text-base"}>
                        <NavLink
                            to={""}
                            className={({ isActive }) =>
                                cn(
                                    "py-1 px-2 mx-3 hover:px-5 hover:mx-0 transition-all border-0 border-b border-solid",
                                    "dark:border-opacity-0 dark:hover:!border-slate-600 dark:hover:border-opacity-100 hover:!bg-slate-800",
                                    isActive &&
                                        "px-4 mx-1 dark:!border-slate-700/60 dark:border-opacity-100 dark:bg-slate-800/60"
                                )
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to={"problems"}
                            className={({ isActive }) =>
                                cn(
                                    "py-1 px-2 mx-3 hover:px-5 hover:mx-0 transition-all border-0 border-b border-solid",
                                    "dark:border-opacity-0 dark:border-slate-600 dark:hover:border-opacity-100 dark:hover:bg-slate-800/60",
                                    isActive &&
                                        "px-3 mx-2 dark:border-slate-700/60 dark:border-opacity-100 dark:bg-slate-800/40"
                                )
                            }
                        >
                            All problems
                        </NavLink>
                    </div>
                </div>
                <div className={"flex gap-6 items-center"}>
                    {organisations.data && (
                        <Popover
                            open={organisationSelectOpen}
                            onOpenChange={setOrganisationSelectOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={organisationSelectOpen}
                                    className={cn(
                                        "flex h-max min-w-[176px] max-w-[200px] justify-between gap-2 transition-all rounded-full dark:border-slate-600",
                                        selectedOrganisation === 1n &&
                                            "dark:bg-green-600/40 hover:dark:bg-green-600/50 rounded-full border border-solid dark:border-green-600"
                                    )}
                                >
                                    <div className={"flex gap-2 items-center"}>
                                        {selectedOrganisation === 1n ? <Check /> : <Users />}
                                        {selectedOrganisation && selectedOrganisation !== 1n
                                            ? cutText(
                                                  organisations.data.find(
                                                      (organisation) =>
                                                          organisation.id === selectedOrganisation
                                                  )?.name ?? "",
                                                  20
                                              )
                                            : "Official events"}
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-80" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search framework..." />
                                    <CommandList>
                                        <CommandEmpty>No framework found.</CommandEmpty>
                                        <CommandGroup>
                                            {organisations.data.map((organisation) => (
                                                <CommandItem
                                                    className={cn(
                                                        organisation.id ===
                                                            DEFAULT_ORGANISATION_ID &&
                                                            "dark:bg-green-600/40 dark:data-[selected='true']:bg-green-600/50"
                                                    )}
                                                    key={organisation.id}
                                                    value={organisation.name}
                                                    onSelect={(currentValue) => {
                                                        updateOrganisationByName(currentValue);
                                                        setOrganisationSelectOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedOrganisation === organisation.id
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {organisation.id === DEFAULT_ORGANISATION_ID
                                                        ? "Official events"
                                                        : organisation.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                    <CommandGroup
                                        className={
                                            "border-0 border-t border-solid border-slate-700"
                                        }
                                    >
                                        <CommandItem>
                                            <Wrench />
                                            Manage organisations
                                        </CommandItem>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                    <div
                        className={cn(
                            "px-3 py-1.5 rounded dark:bg-slate-800 dark:hover:bg-slate-800/60 border border-solid dark:border-slate-700",
                            "flex gap-3 transition-colors cursor-pointer items-center"
                        )}
                        onClick={() => navigate("account")}
                    >
                        <span>{user.full_name}</span>
                        <Avatar className={"h-8 w-8 border-solid dark:border-slate-700"}>
                            <AvatarImage src={user.picture_url} />
                            <AvatarFallback>Pfp</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </nav>
    );
};
