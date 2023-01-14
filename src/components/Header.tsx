import React from 'react'
import Menu from './Menu';
import logo from '../resources/evaluatorLogo.png'
import "./styles.css";

const header: React.FC = () => {
    return (
        <div>
            <div className="logo-container">
                <img src={logo} alt="logo" className='logo' />
            </div>
                <Menu/>
        </div>
    )
}

export default header