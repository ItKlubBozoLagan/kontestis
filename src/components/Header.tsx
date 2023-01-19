import { FC } from "react";

import logo from "/evaluatorLogo.png";

export const Header: FC = () => {
    return (
        <div tw={"w-full flex justify-center items-center"}>
            <img src={logo} alt="logo" />
        </div>
    );
};
