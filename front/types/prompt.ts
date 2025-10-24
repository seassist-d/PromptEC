// プロンプト関連の型定義

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  long_description?: string;
  sample_output?: string;
  price_jpy: number;
  thumbnail_url?: string;
  avg_rating?: number;
  ratings_count: number;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  seller_name: string;
  seller_id: string;
  status: 'draft' | 'published' | 'archived';
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'price_jpy' | 'avg_rating' | 'view_count';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult {
  prompts: Prompt[];
  total_count: number;
  current_page: number;
  total_pages: number;
}

export interface Review {
  id: string;
  prompt_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_avatar?: string;
}

export interface PromptDetail extends Prompt {
  reviews: Review[];
  related_prompts: Prompt[];
}

// API レスポンス用の型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PromptApiResponse extends ApiResponse<Prompt> {}
export interface SearchApiResponse extends ApiResponse<SearchResult> {}
export interface ReviewApiResponse extends ApiResponse<Review[]> {}

// フォーム用の型定義
export interface PromptFormData {
  title: string;
  short_description: string;
  long_description: string;
  sample_output?: string;
  price_jpy: number;
  category_id: number;
  thumbnail?: File;
  tags?: string[];
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
}

// バリデーション用の型定義
export interface PromptValidationError {
  field: keyof PromptFormData;
  message: string;
}

export interface PromptValidationResult {
  isValid: boolean;
  errors: PromptValidationError[];
}
