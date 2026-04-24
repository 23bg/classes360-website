import { create } from "zustand";

type AuthUser = Record<string, unknown> | null;

type AuthStoreState = {
    user: AuthUser;
    isAuthenticated: boolean;
    setUser: (user: AuthUser) => void;
    setAuthenticated: (value: boolean) => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user }),
    setAuthenticated: (value) => set({ isAuthenticated: value }),
}));