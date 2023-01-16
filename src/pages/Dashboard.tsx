import { useState } from 'react';
import Header from "../components/Header";
import Menu from '../components/Menu';
import { FC } from 'react';
import Register from "./Register";

const Dashboard: FC = () => {
    const [user, setUser] = useState("")
    return (
        <div className="header">
            <Header />
            <Menu />
            <Register />
            {
                user !== "" &&
                    <a href="/link"></a>
            }
        </div>
    );
}

export default Dashboard;
