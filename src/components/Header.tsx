import logo from '/evaluatorLogo.png'
import { FC } from 'react';

const Header: FC = () => {
    return (
        <div>
            <div tw={"bg-slate-200 flex justify-center items-center"}>
                <img src={logo} alt="logo" />
            </div>
        </div>
    )
}

export default Header
