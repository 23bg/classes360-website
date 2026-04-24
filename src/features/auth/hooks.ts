import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

/**
 * Custom hook to get current auth user from Redux
 * Use this in components to access current user state
 */
export const useAuth = () => {
    const { data, isLoading, error } = useCurrentUser();

    const user = data?.user ?? null;
    const role = data?.role ?? null;
    const isAuthenticated = !!user;

    return {
        user,
        role,
        isAuthenticated,
        isLoading,
        isError: Boolean(error),
        error,
    };
};

/**
 * Check if user has specific role
 */
export const useHasRole = (requiredRole: string | string[]) => {
    const { role } = useAuth();
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(role || '');
};
