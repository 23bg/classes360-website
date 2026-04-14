type CacheEntry<T> = {
    value: T;
    expiry: number; // epoch ms
};

const store = new Map<string, CacheEntry<unknown>>();

export const setCache = <T>(key: string, value: T, ttlMs = 5 * 60 * 1000) => {
    const expiry = Date.now() + ttlMs;
    store.set(key, { value, expiry });
};

export const getCache = <T>(key: string): T | null => {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        store.delete(key);
        return null;
    }
    return entry.value;
};

export const delCache = (key: string) => {
    store.delete(key);
};

export const clearCache = () => {
    store.clear();
};

export default { setCache, getCache, delCache, clearCache };
