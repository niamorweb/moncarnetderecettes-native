// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  isEmailVerified: boolean;
  stripeCustomerId?: string | null;
  isPremium: boolean;
  profile?: Profile | null;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  userId: string;
}

// Recipe types
export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  servings: number;
  prep_time: number;
  cook_time: number;
  image_url?: string | null;
  cloudinaryPublicId?: string | null;
  isPublic: boolean;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  userId: string;
  recipes?: Recipe[];
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginResponseDto {
  access_token: string;
  refresh_token?: string; // Returned for mobile clients
  user: User;
}

export interface RefreshResponseDto {
  access_token: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
