export interface DeepLinkIntent<T = any> {
    action: string;
    data: T;
}

export const DeepLinkService = {
    parseIntent: <T = any>(searchParams: URLSearchParams): DeepLinkIntent<T> | null => {
        const action = searchParams.get('action');
        if (!action) return null;

        let data: any = {};
        const payload = searchParams.get('payload');

        if (payload) {
            try {
                const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const json = decodeURIComponent(escape(atob(base64)));
                data = JSON.parse(json);
            } catch (e) {
                console.error('DeepLink: Failed to parse payload', e);
            }
        }

        searchParams.forEach((value, key) => {
            if (key !== 'action' && key !== 'payload') {
                data[key] = value;
            }
        });

        return { action, data: data as T };
    },

    generateLink: (path: string, action: string, params: Record<string, string> = {}, payload?: object) => {
        const urlParams = new URLSearchParams();
        urlParams.set('action', action);

        Object.entries(params).forEach(([key, value]) => {
            if (value) urlParams.set(key, value);
        });

        if (payload) {
            try {
                const json = JSON.stringify(payload);
                const base64 = btoa(unescape(encodeURIComponent(json)));
                const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_');
                urlParams.set('payload', urlSafeBase64);
            } catch (e) {
                console.error('DeepLink: Failed to encode payload', e);
            }
        }

        return `${path}?${urlParams.toString()}`;
    }
};