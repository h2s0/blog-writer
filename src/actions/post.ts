'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { MAX_FREE_GENERATIONS_PER_MONTH } from '@/constants'
import type { StyleSample, Subscription } from '@/types/database'

export async function createPost(
  formData: FormData
): Promise<{ error: string } | never> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 생성 횟수 확인
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const subscription = subData as Subscription | null

  if (
    subscription?.plan === 'free' &&
    (subscription?.generation_count_this_month ?? 0) >= MAX_FREE_GENERATIONS_PER_MONTH
  ) {
    return { error: `무료 플랜은 월 ${MAX_FREE_GENERATIONS_PER_MONTH}회까지 생성할 수 있어요.` }
  }

  // 말투 샘플 조회
  const { data: samplesData } = await supabase
    .from('style_samples')
    .select('*')
    .eq('user_id', user.id)

  const samples = (samplesData ?? []) as StyleSample[]
  if (samples.length === 0) {
    return { error: '말투 샘플을 먼저 등록해주세요.' }
  }

  const keyword = formData.get('keyword') as string
  const location = formData.get('location') as string
  const menuItemsRaw = formData.get('menu_items') as string
  const extraInfo = formData.get('extra_info') as string
  const imageUrls = formData.getAll('image_urls') as string[]

  // 글 레코드 생성 (generating 상태, 제목은 AI가 생성)
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title: null,
      location: location || null,
      hours: null,
      menu_items: menuItemsRaw
        ? { raw: menuItemsRaw }
        : null,
      extra_info: extraInfo || null,
      status: 'generating',
    })
    .select()
    .single()

  if (postError || !post) return { error: '글 생성에 실패했습니다.' }

  // 사진 레코드 저장
  if (imageUrls.length > 0) {
    await supabase.from('post_images').insert(
      imageUrls.map((url, i) => ({
        post_id: post.id,
        storage_url: url,
        sort_order: i,
      }))
    )
  }

  // Claude API 호출 (별도 route handler로 위임 — streaming 필요)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postId: post.id,
      userId: user.id,
      samples: samples.map((s) => s.content),
      keyword,
      location,
      menuItems: menuItemsRaw,
      extraInfo,
      imageUrls,
    }),
  })

  // 사용 횟수 증가
  await supabase
    .from('subscriptions')
    .update({
      generation_count_this_month:
        (subscription?.generation_count_this_month ?? 0) + 1,
    })
    .eq('user_id', user.id)

  revalidatePath('/posts')
  revalidatePath('/dashboard')
  redirect(`/posts/${post.id}`)
}
