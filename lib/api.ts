import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Auto-detect the correct API URL based on platform
const getApiUrl = (): string => {
    // 1. Check for explicit env variable first (for production builds)
    const envUrl = process.env.EXPO_PUBLIC_API_URL;

    // If we have a production URL (starts with https), use it
    if (envUrl && envUrl.startsWith('https://')) {
        return envUrl;
    }

    // 2. For development, detect platform
    if (__DEV__) {
        if (Platform.OS === 'android') {
            // Check if running on emulator or physical device
            // Expo provides the host IP that the device connected to
            const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

            if (debuggerHost) {
                // Physical device - use the debugger host IP
                return `http://${debuggerHost}:3000`;
            } else {
                // Emulator fallback
                return 'http://10.0.2.2:3000';
            }
        } else if (Platform.OS === 'ios') {
            // iOS Simulator can use localhost
            return 'http://localhost:3000';
        }
    }

    // Fallback to env or localhost
    return envUrl || 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();

console.log('🌐 API_BASE_URL:', API_BASE_URL);

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

export function getAuthToken(): string | null {
    return authToken;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 Fetching:', url);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const text = await response.text();

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error('❌ Response is not JSON:', text.substring(0, 200));
            throw new Error('Server returned invalid response');
        }

        if (!response.ok) {
            throw new Error(data.error || "Đã xảy ra lỗi");
        }

        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}

// Auth API
export interface User {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export const authApi = {
    login: (username: string, password: string) =>
        request<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        }),

    register: (username: string, password: string, displayName?: string) =>
        request<AuthResponse>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password, displayName }),
        }),
};

// Groups API
export interface GroupMember {
    id: string;
    displayName: string;
    avatar: string | null;
    balance?: number;
}

export interface Group {
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    memberCount: number;
    expenseCount: number;
    balance: number;
    members: GroupMember[];
}

export interface GroupDetail extends Omit<Group, "memberCount" | "expenseCount"> {
    createdBy: { id: string; displayName: string };
    expenses: Expense[];
    totalExpenses: number;
}

export const groupsApi = {
    list: () => request<Group[]>("/api/groups"),

    get: (id: string) => request<GroupDetail>(`/api/groups/${id}`),

    create: (data: { name: string; emoji?: string; description?: string }) =>
        request<Group>("/api/groups", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: { name?: string; emoji?: string; description?: string }) =>
        request<Group>(`/api/groups/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<{ message: string }>(`/api/groups/${id}`, {
            method: "DELETE",
        }),
};

// Expenses API
export interface ExpenseParticipant {
    userId: string;
    amount: number;
    settled: boolean;
    user: { id: string; displayName: string };
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string;
    receiptUrl?: string;
    paidBy: { id: string; displayName: string; avatar: string | null };
    participants: ExpenseParticipant[];
    group?: { id: string; name: string; emoji: string };
}

export const expensesApi = {
    list: (groupId?: string) =>
        request<Expense[]>(groupId ? `/api/expenses?groupId=${groupId}` : "/api/expenses"),

    create: (data: {
        groupId: string;
        amount: number;
        description: string;
        date?: string;
        paidById?: string;
        participants?: { userId: string; amount: number }[];
        receiptId?: string;
    }) =>
        request<Expense>("/api/expenses", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<{ message: string }>(`/api/expenses/${id}`, {
            method: "DELETE",
        }),

    settle: (id: string, participantUserId?: string) =>
        request<{ message: string }>(`/api/expenses/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ participantUserId }),
        }),
};

// Receipts API
export interface ParsedReceipt {
    receiptId: string;
    imageUrl: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    message: string;
}

export const receiptsApi = {
    parse: (imageBase64: string) =>
        request<ParsedReceipt>("/api/receipts/parse", {
            method: "POST",
            body: JSON.stringify({ imageBase64 }),
        }),
};
