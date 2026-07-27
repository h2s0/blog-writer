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
  location: string | null
  hours: string | null
  menu_items: MenuItems | null
  generated_text: string | null
  status: PostStatus
  created_at: string
}

export interface MenuItems {
  items: Array<{
    name: string
    price: number | null
    description: string | null
  }>
}

export interface PostImage {
  id: string
  post_id: string
  storage_url: string
  category: ImageCategory | null
  category_confirmed: boolean
  sort_order: number
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  generation_count_this_month: number
  renewed_at: string
}

export interface Database {
  public: {
    Tables: {
      style_samples: { Row: StyleSample; Insert: Omit<StyleSample, 'id' | 'created_at'>; Update: Partial<Omit<StyleSample, 'id'>> }
      posts: { Row: Post; Insert: Omit<Post, 'id' | 'created_at'>; Update: Partial<Omit<Post, 'id'>> }
      post_images: { Row: PostImage; Insert: Omit<PostImage, 'id'>; Update: Partial<Omit<PostImage, 'id'>> }
      subscriptions: { Row: Subscription; Insert: Omit<Subscription, 'id'>; Update: Partial<Omit<Subscription, 'id'>> }
    }
  }
}
