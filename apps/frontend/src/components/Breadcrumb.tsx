import { FC } from "react";
import { IconType } from "react-icons";

type Properties = {
    prependIcon?: IconType;
    color: string;
    borderColor: string;
    children: string;
};

export const Breadcrumb: FC<Properties> = ({ prependIcon: Icon, color, borderColor, children }) => {
    return (
        <div
            tw={
                "rounded px-1.5 text-sm flex justify-center items-center gap-2 border border-solid select-none"
            }
            style={{ backgroundColor: color, borderColor }}
        >
            {Icon && <Icon size={"14px"} />}
            {children}
        </div>
    );
};
