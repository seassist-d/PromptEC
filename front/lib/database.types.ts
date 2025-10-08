// Supabaseの型定義
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          contact: any | null
          role: 'user' | 'seller' | 'admin'
          is_banned: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact?: any | null
          role?: 'user' | 'seller' | 'admin'
          is_banned?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact?: any | null
          role?: 'user' | 'seller' | 'admin'
          is_banned?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      prompts: {
        Row: {
          id: string
          seller_id: string
          title: string
          slug: string | null
          category_id: number | null
          thumbnail_url: string | null
          price_jpy: number
          currency: string
          short_description: string | null
          long_description: string | null
          sample_output: string | null
          visibility: 'public' | 'unlisted' | 'private'
          status: 'draft' | 'published' | 'suspended' | 'deleted'
          like_count: number
          view_count: number
          avg_rating: number
          ratings_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          slug?: string | null
          category_id?: number | null
          thumbnail_url?: string | null
          price_jpy: number
          currency?: string
          short_description?: string | null
          long_description?: string | null
          sample_output?: string | null
          visibility?: 'public' | 'unlisted' | 'private'
          status?: 'draft' | 'published' | 'suspended' | 'deleted'
          like_count?: number
          view_count?: number
          avg_rating?: number
          ratings_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          slug?: string | null
          category_id?: number | null
          thumbnail_url?: string | null
          price_jpy?: number
          currency?: string
          short_description?: string | null
          long_description?: string | null
          sample_output?: string | null
          visibility?: 'public' | 'unlisted' | 'private'
          status?: 'draft' | 'published' | 'suspended' | 'deleted'
          like_count?: number
          view_count?: number
          avg_rating?: number
          ratings_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: number
          slug: string
          name: string
          description: string | null
          parent_id: number | null
          sort_order: number | null
        }
        Insert: {
          id?: number
          slug: string
          name: string
          description?: string | null
          parent_id?: number | null
          sort_order?: number | null
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          description?: string | null
          parent_id?: number | null
          sort_order?: number | null
        }
      }
      tags: {
        Row: {
          id: number
          slug: string
          name: string
        }
        Insert: {
          id?: number
          slug: string
          name: string
        }
        Update: {
          id?: number
          slug?: string
          name?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'seller' | 'admin'
      visibility: 'public' | 'unlisted' | 'private'
      prompt_status: 'draft' | 'published' | 'suspended' | 'deleted'
    }
  }
}
