import React, { useEffect, useMemo, useState } from "react";
import tw from "twin.macro";

type SwitchProperties<T extends string> = {
    label?: string;
    defaultIndex?: number;
    choice: T[];
    onChange: (value: T) => void;
};

export const TitledSwitch = <T extends string>({
    label,
    defaultIndex,
    choice,
    onChange,
    ...properties
}: SwitchProperties<T> & React.HTMLAttributes<HTMLDivElement>) => {
    const [selectedIndex, setSelectedIndex] = useState(defaultIndex ?? 0);

    const selected = useMemo(() => choice[selectedIndex], [choice, selectedIndex]);

    useEffect(() => onChange(selected), [selected]);

    const ChoiceBox = ({ self, last }: { self: T; last?: boolean }) => (
        <div
            tw={"px-2 cursor-pointer flex-grow border border-solid border-neutral-800 text-center"}
            css={[selected === self ? tw`bg-neutral-300` : "", last ? tw`border-l-0` : ""]}
            onClick={() => setSelectedIndex(choice.indexOf(self))}
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
                {choice.map((a, b) => {
                    return <ChoiceBox self={a} last={b === choice.length - 1} key={a} />;
                })}
            </div>
        </div>
    );
};
