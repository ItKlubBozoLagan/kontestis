import React, { FC, InputHTMLAttributes } from "react";
import styled from "styled-components";

const InputWithTitle = styled.input<{ inputTitle: string }>`
    &::before {
        content: "${({ inputTitle }) => inputTitle}";
    }
`;

export const TitledInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({
    title,
    ...properties
}) => {
    return (
        <div tw={"w-full flex flex-col justify-start"}>
            <div tw={"w-full flex justify-center"}>
                <InputWithTitle
                    inputTitle={title ?? ""}
                    tw={
                        "py-1 px-2 border-neutral-300 bg-neutral-200 border-solid"
                    }
                    {...properties}
                />
            </div>
        </div>
    );
};
