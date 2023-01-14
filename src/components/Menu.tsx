import React from 'react'
import "./styles.css";
import SingleMenuItem from './SingleMenuItem';

const items: string[] = ["Dashboard", "Contests", "Problemset", "Users"];
const userItems: string[] = ["My contests", "Host", "New problem"];

const menu: React.FC = () => {
    return (
        <div className='menu-container'>
            {items.map((item) => (<SingleMenuItem item={item}/>))}
        </div>
    )
}

export default menu