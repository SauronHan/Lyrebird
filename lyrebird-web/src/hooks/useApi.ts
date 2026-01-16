import { useAuth } from "@clerk/nextjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useApi = () => {
    const { getToken } = useAuth();

    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();

        const headers = {
            ...options.headers,
            "Authorization": `Bearer ${token}`,
        };

        // Auto-set Content-Type for JSON unless it's FormData (which has its own boundary)
        if (!(options.body instanceof FormData)) {
            // @ts-ignore
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: headers as HeadersInit,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${response.statusText}`);
        }

        return response.json();
    };

    return {
        get: (endpoint: string) => fetchWithAuth(endpoint, { method: "GET" }),
        post: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(body) }),
        postFormData: (endpoint: string, formData: FormData) => fetchWithAuth(endpoint, { method: "POST", body: formData }),
        del: (endpoint: string) => fetchWithAuth(endpoint, { method: "DELETE" }),
        // Add other methods as needed
    };
};
