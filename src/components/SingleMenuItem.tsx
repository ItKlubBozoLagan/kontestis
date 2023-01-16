import { FC } from "react";
import "./styles.css";

type Props = {
    item: string,
}

const singleMenuItem: FC<Props> = ({item}) => {
    const link: string = "./"+item;
    return (
        <div className='single-menu-item'>
            <a href={link}>{item}</a>
        </div>
    )
}

export default singleMenuItem