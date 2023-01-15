import React, { useState } from 'react';
import '../components/styles.css';
import Header from "../components/Header";
import Menu from '../components/Menu';



function Dashboard() {
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