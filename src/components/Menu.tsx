import { FC } from 'react'
import MenuEntry from './MenuEntry';
import tw from "twin.macro";

const items = ["Dashboard", "Contests", "Problemset", "Users"];
const userItems = ["My contests", "Host", "New problem"];

const Menu: FC = () => {
    return (
        <div css={[
            tw`p-4 flex justify-center gap-4 text-lg`,
            tw`border border-solid border-black rounded-2xl`
        ]}>
            {items.map((item) => (<MenuEntry item={item}/>))}
        </div>
    )
}

export default Menu
