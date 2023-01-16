import logo from '/evaluatorLogo.png'
import { FC } from 'react';

const Header: FC = () => {
    return (
        <div tw={"w-full flex justify-center items-center"}>
            <img src={logo} alt="logo" />
        </div>
    )
}

export default Header
