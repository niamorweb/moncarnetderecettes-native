import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User, LoginResponseDto } from "@/types";
import { getItem, removeItem, setItem } from "@/utils/storage";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: LoginResponseDto) => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  getRefreshToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (data: LoginResponseDto) => {
    try {
      await setItem(TOKEN_KEY, data.access_token);
      await setItem(USER_KEY, JSON.stringify(data.user));

      // Store refresh token if provided (mobile client)
      if (data.refresh_token) {
        await setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }

      set({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error storing auth data:", error);
    }
  },

  setAccessToken: async (token: string) => {
    try {
      await setItem(TOKEN_KEY, token);
      set({ accessToken: token });
    } catch (error) {
      console.error("Error storing access token:", error);
    }
  },

  logout: async () => {
    try {
      await removeItem(TOKEN_KEY);
      await removeItem(REFRESH_TOKEN_KEY);
      await removeItem(USER_KEY);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await getItem(TOKEN_KEY);
      const refreshToken = await getItem(REFRESH_TOKEN_KEY);
      const userData = await getItem(USER_KEY);

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        set({
          user,
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      set({ isLoading: false });
    }
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
      setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  },

  getRefreshToken: async () => {
    // Try from state first, then from SecureStore
    const stateToken = get().refreshToken;
    if (stateToken) return stateToken;

    try {
      return await getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
}));
