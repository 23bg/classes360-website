import { API } from "@/constants/api";
import { getApiUrl } from "@/lib/api/url";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const toApiPath = (value: string) => {
    if (value.startsWith("/api/")) {
        return value;
    }

    const normalized = value.startsWith("/") ? value : `/${value}`;
    return `${API.BASE_V1}${normalized}`;
};

const resolveUrl = (value: string) => (isAbsoluteUrl(value) ? value : getApiUrl(toApiPath(value)));

const parseResponseBody = async (response: Response) => {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const requestRefresh = async () => {
    const refreshResponse = await fetch(resolveUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
    });

    if (!refreshResponse.ok) {
        throw new Error("API Error");
    }

    return parseResponseBody(refreshResponse);
};

export async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
    const requestOptions: RequestInit = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    };

    let response = await fetch(resolveUrl(url), requestOptions);

    if (response.status === 401) {
        await requestRefresh();
        response = await fetch(resolveUrl(url), requestOptions);
    }

    if (!response.ok) {
        throw new Error("API Error");
    }

    return parseResponseBody(response) as Promise<T>;
}