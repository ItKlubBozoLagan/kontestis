import React from 'react'
import logo from '/evaluatorLogo.png'
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