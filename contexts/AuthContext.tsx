import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, setAuthToken, User } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "chiatien_auth_token";
const USER_KEY = "chiatien_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load stored auth on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    async function loadStoredAuth() {
        try {
            const [token, userData] = await Promise.all([
                AsyncStorage.getItem(TOKEN_KEY),
                AsyncStorage.getItem(USER_KEY),
            ]);

            if (token && userData) {
                setAuthToken(token);
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error("Error loading auth:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(username: string, password: string) {
        const response = await authApi.login(username, password);

        await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, response.token),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
        ]);

        setAuthToken(response.token);
        setUser(response.user);
    }

    async function register(username: string, password: string, displayName?: string) {
        const response = await authApi.register(username, password, displayName);

        await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, response.token),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
        ]);

        setAuthToken(response.token);
        setUser(response.user);
    }

    async function logout() {
        await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
        ]);

        setAuthToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
