import { useState } from "react";
import { api } from "@/lib/axios";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export const useAuth = () => {
    const { data, isLoading, error: authQueryError } = useCurrentUser();
    const user = data?.user ?? null;
    const [loading, setLoading] = useState(false);
    const [mutationError, setMutationError] = useState<unknown>(null);

    // Generic wrapper for dispatch + callbacks
    const withCallbacks = async <T>(request: Promise<T>, callbacks?: {
        onSuccess?: (data: any) => void;
        onError?: (error: any) => void;
        onFinally?: () => void;
    }) => {
        const { onSuccess, onError, onFinally } = callbacks || {};

        try {
            setLoading(true);
            setMutationError(null);
            const result = await request;
            onSuccess?.(result);
            return result;
        } catch (err) {
            setMutationError(err);
            onError?.(err);
            throw err;
        } finally {
            setLoading(false);
            onFinally?.();
        }
    };

    // --- AUTH METHODS WITH CALLBACK SUPPORT ---

    const login = (data: { email: string; password: string }, callbacks?: any) =>
        withCallbacks(api.post("auth/login", data).then((res) => res.data), callbacks);

    const signup = (
        data: { email: string; password: string },
        callbacks?: any
    ) => withCallbacks(api.post("auth/signup", data).then((res) => res.data), callbacks);

    const verifyEmail = (
        data: { email: string; otp: string },
        callbacks?: any
    ) => withCallbacks(api.post("auth/verification", data).then((res) => res.data), callbacks);

    const logout = (callbacks?: any) =>
        withCallbacks(api.post("auth/logout", {}).then((res) => res.data), callbacks);

    return {
        user,
        loading: loading || isLoading,
        error: authQueryError ?? mutationError,
        login,
        signup,
        verifyEmail,
        logout,
    };
};

