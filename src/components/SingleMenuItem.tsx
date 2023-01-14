import React from 'react'
import "./styles.css";

interface props{
    item: string,
}

const singleMenuItem = ({item}: props) => {
    const link: string = "./"+item;
    return (
        <div className='single-menu-item'>
            <a href={link}>{item}</a>
        </div>
    )
}

export default singleMenuItem