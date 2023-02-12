import { darkenHex } from "@kontestis/utils";
import { FC } from "react";
import { IconType } from "react-icons";

type Properties = {
    prependIcon?: IconType;
    color: string;
    borderColor?: string;
    children: string | string[];
};

export const Breadcrumb: FC<Properties> = ({
    prependIcon: Icon,
    color,
    borderColor = darkenHex(color, 60),
    children,
}) => {
    return (
        <div
            tw={
                "rounded px-1.5 text-sm flex justify-center items-center gap-2 border border-solid select-none w-[max-content] text-black"
            }
            style={{ backgroundColor: color, borderColor }}
        >
            {Icon && <Icon size={"14px"} />}
            {children}
        </div>
    );
};
