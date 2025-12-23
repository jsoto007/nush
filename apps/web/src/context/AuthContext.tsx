import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiClient, getApiBaseUrl, type User } from "@repo/shared";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    api: ApiClient;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiBaseUrl = getApiBaseUrl(import.meta.env.VITE_API_URL);
const api = new ApiClient(apiBaseUrl);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const response = await api.get<{ user: User }>("/api/v1/auth/me");
            if (response.ok && response.data) {
                setUser(response.data.user);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post<{ user: User }>("/api/v1/auth/login", {
            email,
            password,
        });

        if (response.ok && response.data) {
            setUser(response.data.user);
            return { ok: true };
        }

        return { ok: false, error: response.error };
    };

    const logout = async () => {
        await api.post("/api/v1/auth/logout", {});
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, api, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
