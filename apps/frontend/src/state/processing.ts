import { create } from "zustand";

type ProcessingLoaderStore = {
    isProcessing: boolean;
    setIsProcessing: (_: boolean) => void;
};

export const useProcessingLoader = create<ProcessingLoaderStore>((set) => ({
    isProcessing: false,
    setIsProcessing: (newIsProcessing) => set({ isProcessing: newIsProcessing }),
}));
