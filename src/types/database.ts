import type { ImageCategory, PostStatus, SubscriptionPlan } from '@/constants'

export interface StyleSample {
  id: string
  user_id: string
  content: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string | null
  location: string | null
  hours: string | null
  menu_items: Record<string, unknown> | null
  extra_info: string | null
  generated_text: string | null
  status: PostStatus
  created_at: string
}

export interface PostImage {
  id: string
  post_id: string
  storage_url: string
  sort_order: number
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  generation_count_this_month: number
  renewed_at: string
}

// Supabase 클라이언트 generic 제약을 만족하는 Database 타입
export interface Database {
  public: {
    Tables: {
      style_samples: {
        Row: StyleSample
        Insert: Omit<StyleSample, 'id' | 'created_at'>
        Update: Partial<Omit<StyleSample, 'id'>>
        Relationships: []
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Omit<Post, 'id'>>
        Relationships: []
      }
      post_images: {
        Row: PostImage
        Insert: Omit<PostImage, 'id'>
        Update: Partial<Omit<PostImage, 'id'>>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id'>
        Update: Partial<Omit<Subscription, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      image_category: ImageCategory
      post_status: PostStatus
      subscription_plan: SubscriptionPlan
    }
    CompositeTypes: Record<string, never>
  }
}
