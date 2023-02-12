import { Contest } from "@kontestis/models";
import { createContext, useContext } from "react";

export const ContestContext = createContext<Contest | null>(null);

export const useContestContext = () => {
    const value = useContext(ContestContext);

    if (value === null) throw new Error("useContestContext used outside of provider");

    return value;
};
