export function getApiUrl(path: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    return apiUrl ? `${apiUrl}${path}` : path;
}
