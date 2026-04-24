export type TeamRow = {
    id: string;
    source?: "team" | "teacher";
    role?: "OWNER" | "MANAGER" | "VIEWER";
    name: string;
    phone?: string;
    email?: string;
    active?: boolean;
    subjects?: string;
    experience?: string;
    bio?: string;
};

export default function TeamTable() {
    return null;
}
