import React, { FC, ReactNode, useState } from "react";
import { FiEdit, FiX } from "react-icons/fi";
import { FiCheck } from "react-icons/fi";
import tw from "twin.macro";

type Properties = {
    title: string;
    value: string;
    largeTextValue?: boolean;
    submitFunction: () => void;
    children: ReactNode;
};

export const EditableDisplayBox: FC<Properties> = ({
    title,
    value,
    submitFunction,
    children,
    largeTextValue = false,
}) => {
    const [editMode, setEditMode] = useState(false);

    return (
        <div
            tw={
                "w-full min-h-[4rem] bg-neutral-100 border-2 border-solid border-neutral-200 px-3 py-2 flex flex-col gap-4"
            }
        >
            <div
                tw={"w-full flex items-center justify-between gap-4"}
                css={!largeTextValue ? tw`flex-grow` : ""}
            >
                <span tw={"text-lg whitespace-nowrap"}>{title}</span>
                {editMode ? (
                    <div tw={"flex gap-2 items-center text-xl justify-end [& input]:max-w-[128px]"}>
                        {!largeTextValue && <div>{children}</div>}
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
                        {!largeTextValue && <span tw={"text-right"}>{value}</span>}
                        <FiEdit
                            onClick={() => {
                                setEditMode(true);
                            }}
                            tw={"min-w-[20px] hover:(cursor-pointer text-blue-700)"}
                        />
                    </div>
                )}
            </div>
            {largeTextValue &&
                (editMode ? (
                    <div tw={"w-full [& textarea]:(w-full h-64 max-h-64 resize-none)"}>
                        {children}
                    </div>
                ) : (
                    <div
                        tw={
                            "px-2 overflow-x-scroll border-2 border-solid border-neutral-300 max-h-96"
                        }
                    >
                        <pre tw={"text-sm"}>{value}</pre>
                    </div>
                ))}
        </div>
    );
};
