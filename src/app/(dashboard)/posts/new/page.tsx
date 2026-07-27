import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { PostForm } from '@/components/features/post/post-form'
import type { StyleSample } from '@/types/database'

export default async function NewPostPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('style_samples')
    .select('*')
    .eq('user_id', user!.id)

  const samples = (data ?? []) as StyleSample[]

  if (samples.length === 0) {
    redirect('/settings?hint=sample-required')
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="새 글 작성"
        description="정보와 사진을 입력하면 내 말투로 글을 써드려요"
      />
      <PostForm />
    </div>
  )
}
