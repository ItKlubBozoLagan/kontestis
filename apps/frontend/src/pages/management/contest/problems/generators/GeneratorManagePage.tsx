import { AdminPermissions, ContestMemberPermissions } from "@kontestis/models";
import { FC, useState } from "react";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { CanContestMember } from "../../../../../components/CanContestMember";
import { SimpleButton } from "../../../../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../../components/Table";
import { useContestContext } from "../../../../../context/constestContext";
import { useAllGenerators } from "../../../../../hooks/problem/generator/useAllGenerators";
import { useDeleteGenerator } from "../../../../../hooks/problem/generator/useDeleteGenerator";
import { useProblem } from "../../../../../hooks/problem/useProblem";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { CreateGeneratorModal } from "./CreateGeneratorModal";

type Properties = {
    problemId: string;
};

export const GeneratorManagePage: FC = () => {
    const { problemId } = useParams<Properties>();
    const { data: problem } = useProblem(BigInt(problemId ?? 0));
    const { data: generators } = useAllGenerators([BigInt(problemId ?? 0)]);
    const { member } = useContestContext();
    const { mutate: deleteGenerator } = useDeleteGenerator();
    const [modalOpen, setModalOpen] = useState(false);
    const { t } = useTranslation();

    const handleDelete = (generatorId: bigint) => {
        if (confirm("Are you sure you want to delete this generator?")) {
            deleteGenerator([BigInt(problemId ?? 0), generatorId]);
        }
    };

    return (
        <div tw={"w-full flex flex-col gap-6 items-end"}>
            <div tw={"w-full flex justify-between items-center"}>
                <h2 tw={"text-2xl font-bold"}>Generators for {problem?.title}</h2>
                <CanContestMember
                    member={member}
                    permission={ContestMemberPermissions.EDIT}
                    adminPermission={AdminPermissions.EDIT_CONTEST}
                >
                    <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                        Create Generator
                    </SimpleButton>
                </CanContestMember>
            </div>

            {problem && (
                <CreateGeneratorModal
                    isOpen={modalOpen}
                    onRequestClose={() => setModalOpen(false)}
                    onAfterClose={() => setModalOpen(false)}
                    problemId={BigInt(problemId ?? 0)}
                />
            )}

            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Language</TableHeadItem>
                        <TableHeadItem>Actions</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(generators ?? [])
                        .sort((a, b) => Number(a.id - b.id))
                        .map((generator) => (
                            <TableRow key={generator.id + ""}>
                                <TableItem>
                                    <Link
                                        to={generator.id + ""}
                                        tw={"hover:(text-sky-800 cursor-pointer)"}
                                    >
                                        {generator.name}
                                    </Link>
                                </TableItem>
                                <TableItem>{generator.language}</TableItem>
                                <TableItem>
                                    <div tw={"flex gap-2"}>
                                        <Link to={generator.id + ""}>
                                            <SimpleButton prependIcon={FiEdit} small>
                                                Edit
                                            </SimpleButton>
                                        </Link>
                                        <CanContestMember
                                            member={member}
                                            permission={ContestMemberPermissions.EDIT}
                                            adminPermission={AdminPermissions.EDIT_CONTEST}
                                        >
                                            <SimpleButton
                                                prependIcon={FiTrash2}
                                                small
                                                onClick={() => handleDelete(generator.id)}
                                                danger
                                            >
                                                Delete
                                            </SimpleButton>
                                        </CanContestMember>
                                    </div>
                                </TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
        </div>
    );
};
