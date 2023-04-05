import { create } from "zustand";

type BackendError = "none" | "unavailable" | "rate-limit";

type BackendErrorStore = {
    backendError: BackendError;
    lastUpdate: number;
    setBackendError: (_: BackendError) => void;
};

export const useBackendError = create<BackendErrorStore>((set) => ({
    backendError: "none",
    lastUpdate: Date.now(),
    setBackendError: (backendError) =>
        set({ ...(backendError === "none" ? {} : { lastUpdate: Date.now() }), backendError }),
}));
