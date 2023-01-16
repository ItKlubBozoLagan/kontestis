import { FC } from "react";

type Props = {
    item: string,
}

const MenuEntry: FC<Props> = ({item}) => {
    const link: string = "./"+item;
    return (
        <div tw={"no-underline font-bold text-black hover:(text-gray-600 underline) transition-all"}>
            <a href={link}>{item}</a>
        </div>
    )
}

export default MenuEntry
