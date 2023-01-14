import React, { useState } from 'react';
import '../components/styles.css';
import Header from "../components/Header";



function Dashboard() {
    const [User, setUser] = useState("-1")
    return (
        <div className="header">
            <Header/>
        </div>
    );
  }
  
  export default Dashboard;