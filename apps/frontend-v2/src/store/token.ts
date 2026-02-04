import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useAuthStore } from "./auth";

interface TokenState {
    token: string;
    setToken: (token: string | null) => void;
}

export const useTokenStore = create<TokenState>()(
    persist(
        (set) => ({
            token: "",
            setToken: (token) => {
                if (!token || token.length === 0) {
                    useAuthStore.setState({
                        isLoggedIn: false,
                        user: null,
                    });
                }

                return set({ token: token ?? "" });
            },
        }),
        {
            name: "@kontestis/auth-v2",
        }
    )
);
