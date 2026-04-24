type ClientLogPayload = Record<string, unknown> | string;

const isDev = "development";

const getCircularReplacer = () => {
    const seen = new WeakSet<any>();
    return (_key: string, value: any) => {
        if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
        }
        return value;
    };
};

const safeStringify = (obj: unknown) => {
    try {
        return JSON.stringify(obj, getCircularReplacer(), 2);
    } catch (_e) {
        try {
            return String(obj);
        } catch (_e2) {
            return "[unserializable]";
        }
    }
};

const normalize = (event: string, payload?: ClientLogPayload) => {
    if (typeof payload === "string") {
        return { event, message: payload };
    }

    if (!payload || typeof payload !== "object") {
        return { event, payload: String(payload) };
    }

    // Build a shallow safe copy so accessors/getters can't throw during console inspection
    const safe: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
        try {
            const val = (payload as Record<string, unknown>)[key];
            // prefer primitives and leave objects as-is (console can inspect them)
            if (typeof val === "function") safe[key] = `[Function: ${(val as Function).name || "anonymous"}]`;
            else safe[key] = val;
        } catch (err) {
            safe[key] = `[unreadable: ${String(err)}]`;
        }
    }

    return {
        event,
        ...safe,
    };
};

const safeConsole = (fn: (...args: any[]) => void, ...args: any[]) => {
    try {
        fn(...args);
    } catch (err) {
        try {
            // Fallback to stringified payloads if console inspection throws
            const fallback = args.map((a) => (typeof a === "object" ? safeStringify(a) : String(a)));
            // eslint-disable-next-line no-console
            console.error("[clientLogger] console.* failed, fallback:", ...fallback);
        } catch (_e) {
            // swallow — logging should never crash the app
        }
    }
};

export const clientLogger = {
    info(event: string, payload?: ClientLogPayload) {
        if (isDev) {
            safeConsole(console.info.bind(console), normalize(event, payload));
        }
    },
    warn(event: string, payload?: ClientLogPayload) {
        if (isDev) {
            safeConsole(console.warn.bind(console), normalize(event, payload));
        }
    },
    error(event: string, payload?: ClientLogPayload) {
        if (isDev) {
            safeConsole(console.error.bind(console), normalize(event, payload));
        }
    },
};
