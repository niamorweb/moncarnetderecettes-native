import * as SecureStore from "expo-secure-store";
import type { RefreshResponseDto } from "@/types";
import { Platform } from "react-native";
import { getItem, removeItem, setItem } from "./storage";

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:3001"
    : process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
  skipRefresh?: boolean; // Skip token refresh on 401 (used for refresh endpoint itself)
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

// Track if a refresh is in progress to prevent multiple concurrent refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log("[API] No refresh token available");
        return null;
      }

      console.log("[API] Attempting to refresh access token...");

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.log("[API] Refresh token request failed:", response.status);
        // Clear tokens on refresh failure
        await removeItem(TOKEN_KEY);
        await removeItem(REFRESH_TOKEN_KEY);
        return null;
      }

      const data: RefreshResponseDto = await response.json();
      console.log("[API] Access token refreshed successfully");

      // Store the new access token
      await setItem(TOKEN_KEY, data.access_token);

      return data.access_token;
    } catch (error) {
      console.error("[API] Error refreshing token:", error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { requiresAuth = true, skipRefresh = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Client-Type": "mobile", // Identify as mobile client for backend
    ...(fetchOptions.headers || {}),
  };

  if (requiresAuth) {
    const token = await getItem(TOKEN_KEY);
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log("[API] Request:", fetchOptions.method || "GET", url);

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  console.log("[API] Response status:", response.status);

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && requiresAuth && !skipRefresh) {
    console.log("[API] Got 401, attempting token refresh...");

    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the request with the new token
      console.log("[API] Retrying request with new token...");
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${newToken}`;

      const retryResponse = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      console.log("[API] Retry response status:", retryResponse.status);

      if (!retryResponse.ok) {
        let errorData;
        try {
          errorData = await retryResponse.json();
        } catch {
          errorData = { message: retryResponse.statusText };
        }
        throw new ApiError(
          errorData.message || "Une erreur est survenue",
          retryResponse.status,
          errorData,
        );
      }

      const text = await retryResponse.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    } else {
      // Refresh failed, throw auth error to trigger logout
      throw new ApiError("Session expirée, veuillez vous reconnecter", 401, {
        requiresReauth: true,
      });
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    console.error("[API] Error response:", JSON.stringify(errorData, null, 2));

    throw new ApiError(
      errorData.message || "Une erreur est survenue",
      response.status,
      errorData,
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    }),

  register: (
    email: string,
    password: string,
    username?: string,
    name?: string,
  ) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username, name }),
      requiresAuth: false,
    }),

  logout: () =>
    api("/auth/logout", {
      method: "POST",
    }),

  refresh: (refreshToken: string) =>
    api<RefreshResponseDto>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      requiresAuth: false,
      skipRefresh: true, // Don't try to refresh on this endpoint
    }),
};

// Recipes endpoints
export const recipesApi = {
  getAll: () => api<any[]>("/recipes/all"),

  getById: (id: string) => api<any>(`/recipes/${id}`),

  create: (data: any) =>
    api("/recipes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createWithImage: async (data: FormData) => {
    const token = await getItem(TOKEN_KEY);

    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Type": "mobile",
      },
      body: data,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erreur lors de la création" }));
      throw new ApiError(
        errorData.message || "Erreur lors de la création",
        response.status,
        errorData,
      );
    }

    return response.json();
  },

  update: (id: string, data: any) =>
    api(`/recipes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateWithImage: async (id: string, data: FormData) => {
    const token = await getItem(TOKEN_KEY);

    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Type": "mobile",
      },
      body: data,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erreur lors de la mise à jour" }));
      throw new ApiError(
        errorData.message || "Erreur lors de la mise à jour",
        response.status,
        errorData,
      );
    }

    return response.json();
  },

  delete: (id: string) =>
    api(`/recipes/${id}`, {
      method: "DELETE",
    }),

  bulkMove: (recipeIds: string[], categoryId: string | null) =>
    api("/recipes/bulk-move", {
      method: "PATCH",
      body: JSON.stringify({ recipeIds, categoryId }),
    }),

  bulkDelete: (ids: string[]) =>
    api("/recipes/bulk-delete", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};

// Categories endpoints
export const categoriesApi = {
  getAll: () => api<any[]>("/categories"),

  create: (name: string) =>
    api("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    api(`/categories/${id}`, {
      method: "DELETE",
    }),
};

// Profile endpoints
export const profileApi = {
  getMe: () => api<any>("/profiles/me"),

  update: async (data: FormData) => {
    const token = await getItem(TOKEN_KEY);

    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Type": "mobile",
        // Don't set Content-Type for FormData - let fetch set it with boundary
      },
      body: data,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erreur lors de la mise à jour" }));
      throw new ApiError(
        errorData.message || "Erreur lors de la mise à jour",
        response.status,
        errorData,
      );
    }

    return response.json();
  },
};

// Gemini AI endpoints
export interface ScanRecipeResponse {
  success: boolean;
  data: string; // JSON string with extracted recipe data
}

export interface ExtractedRecipeData {
  nom: string;
  portions: number;
  temps_preparation: number;
  temps_cuisson: number;
  ingredients: string[];
  etapes: string[];
}

export const geminiApi = {
  extractRecipe: async (imageUri: string): Promise<ExtractedRecipeData> => {
    const token = await getItem(TOKEN_KEY);

    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "recipe.jpg",
    } as any);

    const response = await fetch(`${API_BASE_URL}/gemini/extract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Type": "mobile",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Erreur lors de l'extraction" }));
      throw new ApiError(
        errorData.message || "Erreur lors de l'extraction",
        response.status,
        errorData,
      );
    }

    const result: ScanRecipeResponse = await response.json();
    if (!result.success) {
      throw new ApiError("Échec de l'extraction de la recette", 400);
    }

    return JSON.parse(result.data);
  },
};

export { ApiError };
