import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useAuthStore } from "./auth";

type TokenState = {
    token: string;
    setToken: (_: string) => void;
};

export const useTokenStore = create<TokenState>()(
    persist(
        (set) => ({
            token: "",
            setToken: (token) => {
                if (token.length === 0)
                    useAuthStore.setState({
                        isLoggedIn: false,
                        user: {} as any,
                    });

                return set((state) => ({
                    token: token,
                }));
            },
        }),
        {
            name: "@kontestis/auth",
        }
    )
);
