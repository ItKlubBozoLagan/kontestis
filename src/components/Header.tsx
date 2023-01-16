import logo from '/evaluatorLogo.png'
import "./styles.css";
import { FC } from 'react';

const Header: FC = () => {
    return (
        <div>
            <div className="logo-container">
                <img src={logo} alt="logo" className='logo' />
            </div>
        </div>
    )
}

export default Header