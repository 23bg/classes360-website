import { useMutation } from "@tanstack/react-query";
import { logoutUser } from "@/features/studentPortal/studentPortalApi";

export function useLogout() {
    return useMutation({
        mutationFn: logoutUser,
    });
}
