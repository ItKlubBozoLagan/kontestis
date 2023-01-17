import { useState } from "react";
import { FC } from "react";

import Header from "../components/Header";
import NavBar from "../components/NavBar";
import { Contests } from "./contests/Contests";
import Register from "./Register";

const Dashboard: FC = () => {
    const [user, setUser] = useState("");

    return (
        <div tw={"w-full flex flex-col items-center mt-[-0.8rem]"}>
            <NavBar />
            {
                <div
                    tw={
                        "flex flex-col w-[800px] items-center justify-start gap-y-5"
                    }
                >
                    <Contests />
                    <Header />
                    <Register />
                </div>
            }
        </div>
    );
};

export default Dashboard;
