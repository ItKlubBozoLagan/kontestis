import { useState } from 'react';
import '../components/styles.css';
import Header from "../components/Header";
import Menu from '../components/Menu';
import { FC } from 'react';

const Dashboard: FC = () => {
    const [user, setUser] = useState("")
    return (
        <div className="header">
            <Header/>
            <Menu/>
            {
                user !== "" &&
                <a href="/Link"></a>
            }
        </div>
    );
}

export default Dashboard;