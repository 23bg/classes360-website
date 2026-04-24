import { create } from "zustand";

type StudentPortalStoreState = {
    authLoading: boolean;
    setAuthLoading: (value: boolean) => void;
};

export const useStudentPortalStore = create<StudentPortalStoreState>((set) => ({
    authLoading: false,
    setAuthLoading: (value) => set({ authLoading: value }),
}));
