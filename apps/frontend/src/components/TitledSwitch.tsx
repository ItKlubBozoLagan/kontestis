import React, { useEffect, useState } from "react";
import tw from "twin.macro";

type SwitchProperties<T extends string> = {
    label?: string;
    choice: [T, T];
    onChange: (value: T) => void;
};

export const TitledSwitch = <T extends string>({
    label,
    choice,
    onChange,
    ...properties
}: SwitchProperties<T> & React.HTMLAttributes<HTMLDivElement>) => {
    const [selected, setSelected] = useState(choice[0]);

    useEffect(() => onChange(selected), [selected]);

    const ChoiceBox = ({ self, last }: { self: T; last?: boolean }) => (
        <div
            tw={"px-2 cursor-pointer flex-grow border border-solid border-neutral-800 text-center"}
            css={[selected === self ? tw`bg-neutral-300` : "", last ? tw`border-l-0` : ""]}
            onClick={() => setSelected(self)}
        >
            {self}
        </div>
    );

    return (
        <div tw={"flex flex-col gap-1 pt-2 w-full"}>
            {label && <span>{label}</span>}
            <div
                tw={"bg-neutral-100 text-base flex overflow-hidden w-[fit-content] w-full"}
                {...properties}
            >
                <ChoiceBox self={choice[0]} />
                <ChoiceBox self={choice[1]} last />
            </div>
        </div>
    );
};
