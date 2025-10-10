// 認証関連の型定義

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    display_name?: string;
    avatar_url?: string;
  };
  app_metadata: {
    role?: string;
  };
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  agreeToTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (data: RegisterFormData) => Promise<{ success: boolean; message: string }>;
  signIn: (data: LoginFormData) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

// Server Action用の型定義
export interface ServerActionResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface RegisterServerResult extends ServerActionResult {
  user?: AuthUser;
}

export interface LoginServerResult extends ServerActionResult {
  user?: AuthUser;
}

// バリデーション用の型定義
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
