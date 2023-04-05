import { create } from "zustand";

type ProcessingLoaderStore = {
    processingCount: number;
    startProcessing: () => void;
    endProcessing: () => void;
};

export const useProcessingLoader = create<ProcessingLoaderStore>((set, get) => ({
    processingCount: 0,
    startProcessing: () => set({ processingCount: get().processingCount + 1 }),
    endProcessing: () => set({ processingCount: Math.max(0, get().processingCount - 1) }),
}));
