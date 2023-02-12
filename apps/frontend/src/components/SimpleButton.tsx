import { darkenHex } from "@kontestis/utils";
import { ButtonHTMLAttributes, FC } from "react";
import { IconType } from "react-icons";
import styled from "styled-components";
import tw, { theme } from "twin.macro";

type Properties = {
    color?: string;
    prependIcon?: IconType;
};

const ButtonStyle = styled.button<{ $color: string }>`
    background-color: ${({ $color }) => $color};
    ${tw`w-auto text-black font-mono px-2 py-1 cursor-pointer h-[max-content]`}
    ${tw`flex gap-1 items-center border border-neutral-500`}
    
    &:hover {
        background-color: ${({ $color }) => darkenHex($color, 10)};
    }

    &:active {
        background-color: ${({ $color }) => darkenHex($color, 15)};
        ${tw`pt-1.5 pb-0.5`}
    }
`;

export const SimpleButton: FC<ButtonHTMLAttributes<HTMLButtonElement> & Properties> = ({
    color = theme`colors.neutral.300`!,
    children,
    prependIcon: PrependIcon,
    ...properties
}) => {
    return (
        <ButtonStyle $color={color} {...properties}>
            {PrependIcon && <PrependIcon size={14} />}
            {children}
        </ButtonStyle>
    );
};
