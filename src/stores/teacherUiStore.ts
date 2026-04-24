import { create } from "zustand";

export type TeacherForm = {
    name: string;
    subject: string;
    bio: string;
};

export type TeacherUiState = {
    dialogOpen: boolean;
    editingId: string | null;
    form: TeacherForm;
    page: number;
    setDialogOpen: (value: boolean) => void;
    setEditingId: (value: string | null) => void;
    setForm: (value: TeacherForm) => void;
    setPage: (value: number) => void;
    reset: () => void;
};

const emptyForm: TeacherForm = {
    name: "",
    subject: "",
    bio: "",
};

export const useTeacherUiStore = create<TeacherUiState>((set) => ({
    dialogOpen: false,
    editingId: null,
    form: emptyForm,
    page: 1,
    setDialogOpen: (value) => set({ dialogOpen: value }),
    setEditingId: (value) => set({ editingId: value }),
    setForm: (value) => set({ form: value }),
    setPage: (value) => set({ page: value }),
    reset: () => set({ dialogOpen: false, editingId: null, form: emptyForm, page: 1 }),
}));
