import { FC } from 'react'
import "./styles.css";
import SingleMenuItem from './SingleMenuItem';

const items = ["Dashboard", "Contests", "Problemset", "Users"];
const userItems = ["My contests", "Host", "New problem"];

const menu: FC = () => {
    return (
        <div className='menu-container'>
            {items.map((item) => (<SingleMenuItem item={item}/>))}
        </div>
    )
}

export default menu