'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { MAX_STYLE_SAMPLES } from '@/constants'

export async function addStyleSample(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const content = (formData.get('content') as string).trim()
  if (!content) return { error: '내용을 입력해주세요.' }
  if (content.length < 100) return { error: '샘플은 최소 100자 이상이어야 합니다.' }

  const { count } = await supabase
    .from('style_samples')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= MAX_STYLE_SAMPLES) {
    return { error: `샘플은 최대 ${MAX_STYLE_SAMPLES}개까지 등록할 수 있습니다.` }
  }

  const { error } = await supabase
    .from('style_samples')
    .insert({ user_id: user.id, content })

  if (error) return { error: '저장에 실패했습니다.' }

  revalidatePath('/settings')
}

export async function deleteStyleSample(id: string): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('style_samples')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: '삭제에 실패했습니다.' }

  revalidatePath('/settings')
}
