export const MAX_FREE_GENERATIONS_PER_MONTH = 3
export const MAX_STYLE_SAMPLES = 3

export const IMAGE_UPLOAD_MAX_DIMENSION = 1200
export const IMAGE_UPLOAD_QUALITY = 0.85

export const IMAGE_CATEGORIES = ['exterior', 'interior', 'menu', 'food'] as const
export type ImageCategory = (typeof IMAGE_CATEGORIES)[number]

export const POST_STATUS = ['draft', 'generating', 'done'] as const
export type PostStatus = (typeof POST_STATUS)[number]

export const SUBSCRIPTION_PLANS = ['free', 'pro'] as const
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]
