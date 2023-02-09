import { FullUser } from "@kontestis/models";
import { mapFields } from "@kontestis/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
    isLoggedIn: boolean;
    token: string;
    user: FullUser;
    setIsLoggedIn: (_: boolean) => void;
    setToken: (_: string) => void;
    setUser: (_: FullUser) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            token: "",
            user: {} as any,
            setToken: (token) =>
                set((state) => ({
                    token: token,
                    user: token.length === 0 ? ({} as any) : state.user,
                    isLoggedIn: token.length === 0 ? false : state.isLoggedIn,
                })),
            setUser: (user) =>
                set({ user: mapFields(user, ["id", "permissions"], BigInt) }),
            setIsLoggedIn: (newLoggedIn) => set({ isLoggedIn: newLoggedIn }),
        }),
        {
            name: "@kontestis/auth",
        }
    )
);
