import { Organisation } from "@kontestis/models";
import { Building2, LogOut, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    useAllOrganisations,
    useCreateOrganisation,
    useSelfOrganisationMembers,
} from "@/api/organisations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/i18n/useTranslation";
import { useOrganisationStore, useTokenStore } from "@/store";

export function OrganisationSelectPage() {
    const { setIsSelected, setOrganisationId, skipOrganisationSelect, setSkipOrganisationSelect } =
        useOrganisationStore();
    const { setToken } = useTokenStore();
    const { t } = useTranslation();

    const { data: organisations, isLoading } = useAllOrganisations();
    const { data: selfMembers } = useSelfOrganisationMembers();
    const createOrganisationMutation = useCreateOrganisation();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");

    const ownOrganisations = useMemo(
        () =>
            !organisations || !selfMembers
                ? []
                : organisations.filter((it) =>
                      selfMembers.some((mem) => mem.organisation_id === it.id)
                  ),
        [selfMembers, organisations]
    );

    const handleOrganisationClick = useCallback(
        (organisation: Organisation) => {
            setIsSelected(true);
            setOrganisationId(organisation.id);
            setSkipOrganisationSelect(false);
        },
        [setIsSelected, setOrganisationId, setSkipOrganisationSelect]
    );

    // Auto-select if only one organisation
    useEffect(() => {
        if (!skipOrganisationSelect || (organisations ?? []).length !== 1) return;

        setIsSelected(true);
        setSkipOrganisationSelect(false);
        setOrganisationId(organisations![0].id);
    }, [
        organisations,
        skipOrganisationSelect,
        setIsSelected,
        setOrganisationId,
        setSkipOrganisationSelect,
    ]);

    const handleCreateOrganisation = () => {
        if (!newOrgName.trim()) return;

        createOrganisationMutation.mutate(
            { name: newOrgName },
            {
                onSuccess: (org) => {
                    setCreateDialogOpen(false);
                    setNewOrgName("");
                    handleOrganisationClick(org);
                },
            }
        );
    };

    const handleLogout = () => {
        setToken("");
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Building2 className="h-6 w-6" />
                        {t("organisations.page.title")}
                    </CardTitle>
                    <CardDescription>{t("organisations.selectDescription")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Own Organisations */}
                    {ownOrganisations.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {t("organisations.yourOrganisations")}
                            </h3>
                            <div className="grid gap-3">
                                {ownOrganisations.map((org) => (
                                    <OrganisationCard
                                        key={org.id.toString()}
                                        organisation={org}
                                        onClick={() => handleOrganisationClick(org)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Organisations */}
                    {organisations && organisations.length > ownOrganisations.length && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {t("organisations.allOrganisations")}
                            </h3>
                            <div className="grid gap-3 max-h-64 overflow-y-auto">
                                {organisations
                                    .filter(
                                        (org) => !ownOrganisations.some((own) => own.id === org.id)
                                    )
                                    .map((org) => (
                                        <OrganisationCard
                                            key={org.id.toString()}
                                            organisation={org}
                                            onClick={() => handleOrganisationClick(org)}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {organisations?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No organisations available. Create one to get started.
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("organisations.page.createButton")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t("organisations.page.modal.title")}</DialogTitle>
                                    <DialogDescription>
                                        Create a new organisation to manage your contests and
                                        problems.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Organisation Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="My Organisation"
                                            value={newOrgName}
                                            onChange={(e) => setNewOrgName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateOrganisation}
                                        disabled={
                                            !newOrgName.trim() ||
                                            createOrganisationMutation.isPending
                                        }
                                    >
                                        {createOrganisationMutation.isPending
                                            ? "Creating..."
                                            : "Create"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface OrganisationCardProperties {
    organisation: Organisation;
    onClick: () => void;
}

function OrganisationCard({ organisation, onClick }: OrganisationCardProperties) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
        >
            <Avatar className="h-12 w-12">
                <AvatarImage src={organisation.avatar_url} alt={organisation.name} />
                <AvatarFallback>{organisation.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{organisation.name}</p>
            </div>
        </button>
    );
}
