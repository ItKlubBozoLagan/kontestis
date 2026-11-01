import type { Contest } from "@kontestis/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Download, UserPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useBulkCreateTemporaryUsers } from "@/api/auth";
import { contestQueries, saveBlob } from "@/api/contests";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Created = { name: string; username: string; password: string };

// written via the code point to keep both prettier and the double-quote lint rule happy
const QUOTE = String.fromCodePoint(34);

const csvField = (value: string) =>
    /[\n",]/.test(value) ? QUOTE + value.replaceAll(QUOTE, QUOTE + QUOTE) + QUOTE : value;

/** Creates contest-locked accounts in bulk and shows their one-time credentials (site admins). */
export const BulkTemporaryUsers = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { data: contests = [] } = useQuery(contestQueries.all());
    const queryClient = useQueryClient();
    const bulk = useBulkCreateTemporaryUsers();
    const [prefix, setPrefix] = useState("");
    const [names, setNames] = useState("");
    const [extra, setExtra] = useState<string[]>([]);
    const [results, setResults] = useState<Created[]>([]);

    const nameList = names
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean);

    const others = contests.filter((it) => it.id !== contest.id);

    const downloadCsv = () => {
        const rows = [
            ["Name", "Username", "Password"],
            ...results.map((it) => [it.name, it.username, it.password]),
        ].map((row) => row.map(csvField).join(","));

        saveBlob(
            new Blob([rows.join("\n")], { type: "text/csv" }),
            `temporary_users_${contest.name.replace(/[^\dA-Za-z]/g, "_")}.csv`
        );
    };

    return (
        <Section title={t("management.participants.bulk.title")} icon={UserPlus}>
            <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();

                    if (nameList.length === 0 || !prefix.trim()) return;

                    bulk.mutate(
                        {
                            names: nameList,
                            prefix: prefix.trim(),
                            contest_ids: [contest.id.toString(), ...extra],
                        },
                        {
                            onSuccess: (created) => {
                                setResults(created);
                                void queryClient.invalidateQueries({ queryKey: ["contests"] });
                                setNames("");
                                toast.success(
                                    t("management.participants.bulk.created", {
                                        count: created.length,
                                    })
                                );
                            },
                        }
                    );
                }}
            >
                <p className="text-muted-foreground text-sm">
                    {t("management.participants.bulk.description")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="bulk-prefix">
                            {t("management.participants.bulk.prefix")}
                        </Label>
                        <Input
                            id="bulk-prefix"
                            value={prefix}
                            onChange={(event) => setPrefix(event.target.value)}
                            placeholder={t("management.participants.bulk.prefixPlaceholder")}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{t("management.participants.bulk.extraContests")}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between font-normal"
                                >
                                    <span className="truncate">
                                        {extra.length === 0
                                            ? t("common.none")
                                            : others
                                                  .filter((it) => extra.includes(it.id.toString()))
                                                  .map((it) => it.name)
                                                  .join(", ")}
                                    </span>
                                    <ChevronsUpDown className="opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t("common.search")} />
                                    <CommandList>
                                        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                                        <CommandGroup>
                                            {others.map((other) => {
                                                const id = other.id.toString();
                                                const selected = extra.includes(id);

                                                return (
                                                    <CommandItem
                                                        key={id}
                                                        value={`${other.name} ${id}`}
                                                        onSelect={() =>
                                                            setExtra((previous) =>
                                                                selected
                                                                    ? previous.filter(
                                                                          (it) => it !== id
                                                                      )
                                                                    : [...previous, id]
                                                            )
                                                        }
                                                    >
                                                        <Check
                                                            className={cn(!selected && "opacity-0")}
                                                        />
                                                        <span className="truncate">
                                                            {other.name}
                                                        </span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="bulk-names">
                        {t("management.participants.bulk.names")}
                        {nameList.length > 0 && (
                            <span className="text-muted-foreground">({nameList.length})</span>
                        )}
                    </Label>
                    <Textarea
                        id="bulk-names"
                        value={names}
                        onChange={(event) => setNames(event.target.value)}
                        placeholder={t("management.participants.bulk.namesPlaceholder")}
                        className="min-h-32 font-mono"
                    />
                </div>
                <Button
                    type="submit"
                    className="self-end"
                    disabled={bulk.isPending || nameList.length === 0 || !prefix.trim()}
                >
                    {t("management.participants.bulk.submit")}
                </Button>
            </form>
            {results.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                            {t("management.participants.bulk.created", { count: results.length })}
                        </span>
                        <Button variant="outline" size="sm" onClick={downloadCsv}>
                            <Download />
                            {t("management.participants.bulk.download")}
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/70">
                                <TableRow>
                                    <TableHead>{t("management.participants.bulk.name")}</TableHead>
                                    <TableHead>
                                        {t("management.participants.bulk.username")}
                                    </TableHead>
                                    <TableHead>
                                        {t("management.participants.bulk.password")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-mono text-[13px]">
                                {results.map((user) => (
                                    <TableRow key={user.username}>
                                        <TableCell className="font-sans">{user.name}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.password}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </Section>
    );
};
