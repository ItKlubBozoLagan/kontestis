import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
    token: string;
    setToken: (newToken: string) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({ token: "", setToken: (token) => set({ token: token }) }),
        {
            name: "auth-token",
        }
    )
);
