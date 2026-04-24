import { create } from "zustand";
import type { TeamRow } from "@/features/team/components/TeamTable";
import type { TeamFormValues } from "@/features/team/components/TeamForm";

const emptyForm: TeamFormValues = {
    name: "",
    phone: "",
    email: "",
    role: "MANAGER",
    active: true,
    subjects: "",
    experience: "",
    bio: "",
};

type TeamUiState = {
    open: boolean;
    editing: TeamRow | null;
    form: TeamFormValues;
    setOpen: (open: boolean) => void;
    setEditing: (editing: TeamRow | null) => void;
    setForm: (form: TeamFormValues) => void;
    reset: () => void;
};

export const useTeamUiStore = create<TeamUiState>((set) => ({
    open: false,
    editing: null,
    form: emptyForm,
    setOpen: (open) => set({ open }),
    setEditing: (editing) => set({ editing }),
    setForm: (form) => set({ form }),
    reset: () => set({ open: false, editing: null, form: emptyForm }),
}));
