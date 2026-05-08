import axiosInstance from '@/lib/api/axios-config';
import type { AuthResponse } from '@/types/auth';


export interface LoginCredentials {
    username: string;
    password: string;
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const { data } = await axiosInstance.post('/auth/login/', credentials);
        return data;
    },

    logout: async (): Promise<void> => {
        await axiosInstance.post('/auth/logout/');
    }
};