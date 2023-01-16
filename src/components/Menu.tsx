import React from 'react'
import "./styles.css";
import SingleMenuItem from './SingleMenuItem';

const items = ["Dashboard", "Contests", "Problemset", "Users"];
const userItems = ["My contests", "Host", "New problem"];

const menu: React.FC = () => {
    return (
        <div className='menu-container'>
            {items.map((item) => (<SingleMenuItem item={item}/>))}
        </div>
    )
}

export default menu