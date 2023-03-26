import React, { FC, ReactNode, useState } from "react";
import { FiEdit, FiX } from "react-icons/fi";
import { FiCheck } from "react-icons/fi";

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
                "w-full h-14 bg-neutral-100 border-2 border-solid border-neutral-200 px-3 py-2 flex items-center justify-between gap-4"
            }
        >
            <span tw={"text-lg whitespace-nowrap"}>{title}</span>
            {editMode ? (
                <div tw={"flex gap-2 items-center text-xl justify-end [& input]:max-w-[128px]"}>
                    <div>{children}</div>
                    <FiX
                        onClick={() => {
                            setEditMode(false);
                        }}
                        tw={"cursor-pointer text-red-500 hover:text-red-700"}
                    />
                    <FiCheck
                        onClick={() => {
                            setEditMode(false);
                            submitFunction();
                        }}
                        tw={"cursor-pointer text-green-600 hover:text-green-700"}
                    />
                </div>
            ) : (
                <div tw={"flex w-full gap-2 items-center text-lg justify-end"}>
                    {textValue ? (
                        <pre tw={"text-sm"}>{value}</pre>
                    ) : (
                        <span tw={" text-right"}>{value}</span>
                    )}
                    <FiEdit
                        onClick={() => {
                            setEditMode(true);
                        }}
                        tw={"min-w-[20px] hover:(cursor-pointer text-blue-700)"}
                    />
                </div>
            )}
        </div>
    );
};
