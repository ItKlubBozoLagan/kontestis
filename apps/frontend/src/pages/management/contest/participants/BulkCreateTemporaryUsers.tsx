import React, { FC, useState } from "react";
import tw from "twin.macro";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useBulkCreateTemporaryUsers } from "../../../../hooks/auth/useBulkCreateTemporaryUsers";

type CreatedUser = {
    name: string;
    username: string;
    password: string;
};

export const BulkCreateTemporaryUsers: FC = () => {
    const { contest } = useContestContext();
    const [names, setNames] = useState("");
    const [prefix, setPrefix] = useState("");
    const [results, setResults] = useState<CreatedUser[]>([]);

    const bulkCreateMutation = useBulkCreateTemporaryUsers(contest.id, {
        onSuccess: (data) => {
            setResults(data);
            setNames("");
        },
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const nameList = names
            .split("\n")
            .map((n) => n.trim())
            .filter((n) => n.length > 0);

        if (nameList.length === 0 || prefix.trim().length === 0) return;

        bulkCreateMutation.mutate({
            names: nameList,
            contest_ids: [contest.id.toString()],
            prefix: prefix.trim(),
        });
    };

    const downloadCsv = () => {
        const header = "Name,Username,Password\n";
        const rows = results.map((r) => `${r.name},${r.username},${r.password}`).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `temporary_users_${contest.name.replace(/[^\dA-Za-z]/g, "_")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div tw={"flex flex-col gap-4"}>
            <span tw={"text-lg font-bold"}>Bulk Create Temporary Users</span>
            <form onSubmit={handleSubmit}>
                <div tw={"flex flex-col gap-2"}>
                    <TitledInput
                        label={"Username prefix (e.g. nap2026):"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"nap2026"}
                        value={prefix}
                        onChange={(event) => setPrefix(event.target.value)}
                    />
                    <span tw={"text-base"}>Names (one per line):</span>
                    <textarea
                        tw={
                            "w-full h-32 py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300 resize-y font-[inherit]"
                        }
                        value={names}
                        onChange={(event) => setNames(event.target.value)}
                        placeholder={"Alice\nBob\nCharlie"}
                    />
                    <div tw={"flex gap-2 items-center"}>
                        <SimpleButton disabled={bulkCreateMutation.isLoading}>
                            {bulkCreateMutation.isLoading ? "Creating..." : "Create Users"}
                        </SimpleButton>
                        {bulkCreateMutation.isError && (
                            <span tw={"text-red-500"}>Failed to create users</span>
                        )}
                    </div>
                </div>
            </form>
            {results.length > 0 && (
                <div tw={"flex flex-col gap-2"}>
                    <div tw={"flex gap-2 items-center justify-between"}>
                        <span tw={"font-bold"}>Created {results.length} temporary user(s):</span>
                        <SimpleButton onClick={downloadCsv}>Download CSV</SimpleButton>
                    </div>
                    <div tw={"overflow-x-auto"}>
                        <table
                            css={[
                                tw`w-full border-collapse`,
                                tw`[& th]:(text-left p-2 bg-neutral-300 border border-solid border-neutral-400)`,
                                tw`[& td]:(p-2 bg-neutral-100 border border-solid border-neutral-300 font-mono text-sm)`,
                            ]}
                        >
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Password</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((user) => (
                                    <tr key={user.username}>
                                        <td>{user.name}</td>
                                        <td>{user.username}</td>
                                        <td>{user.password}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
