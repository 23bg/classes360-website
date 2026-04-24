export type TeamFormValues = {
    name: string;
    phone: string;
    email: string;
    role: "OWNER" | "MANAGER" | "VIEWER";
    active: boolean;
    subjects?: string;
    experience?: string;
    bio?: string;
};

export default function TeamForm() {
    return null;
}
