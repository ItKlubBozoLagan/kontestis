import { FC, ReactNode, useState } from "react";
import { FiCheck, FiEdit, FiX } from "react-icons/all";

type Properties = {
    title: string;
    value: string;
    textValue?: boolean;
    submitFunction: () => void;
    children: ReactNode;
};

export const EditableDisplayBox: FC<Properties> = ({
    title,
    value,
    submitFunction,
    children,
    textValue = false,
}) => {
    const [editMode, setEditMode] = useState(false);

    return (
        <div
            tw={
                "w-full bg-neutral-100 border-2 border-solid border-neutral-200 p-4 flex justify-between gap-4"
            }
        >
            <div tw={"flex items-center gap-4 text-lg w-full"}>{title}</div>
            {editMode ? (
                <div tw={"w-1/2 flex gap-1 items-center text-xl justify-end"}>
                    <div tw={"w-full"}>{children}</div>
                    <FiCheck
                        onClick={() => {
                            setEditMode(false);
                            submitFunction();
                        }}
                        tw={"min-w-[20px] text-lg hover:(cursor-pointer text-green-700)"}
                    />
                    <FiX
                        onClick={() => {
                            setEditMode(false);
                        }}
                        tw={"min-w-[20px] hover:(cursor-pointer text-red-700)"}
                    />
                </div>
            ) : (
                <div tw={"flex w-full gap-2 items-center text-xl justify-end"}>
                    {textValue ? <pre tw={"text-sm"}>{value}</pre> : <span>{value}</span>}
                    <FiEdit
                        onClick={() => setEditMode(true)}
                        tw={"min-w-[20px] hover:(cursor-pointer text-blue-700)"}
                    />
                </div>
            )}
        </div>
    );
};
