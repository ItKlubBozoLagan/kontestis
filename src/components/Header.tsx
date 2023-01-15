import React from 'react'
import Menu from './Menu';
import logo from '../resources/evaluatorLogo.png'
import "./styles.css";

const Header: React.FC = () => {
    return (
        <div>
            <div className="logo-container">
                <img src={logo} alt="logo" className='logo' />
            </div>
        </div>
    )
}

export default Header