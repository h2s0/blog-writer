import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Spinner } from '@/components/ui/spinner'
import { CopyButton } from '@/components/features/post/copy-button'
import type { Post } from '@/types/database'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  const post = data as Post

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={post.title || post.location || '생성된 글'}
        description={new Date(post.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      >
        {post.status === 'done' && post.generated_text && (
          <CopyButton text={post.generated_text} />
        )}
      </PageHeader>

      {post.status === 'generating' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Spinner size="lg" />
          <p className="text-muted-foreground text-sm">
            글을 생성하고 있어요. 잠시만 기다려주세요...
          </p>
          <p className="text-muted-foreground text-xs">
            페이지를 새로고침하면 결과를 확인할 수 있어요.
          </p>
        </div>
      )}

      {post.status === 'done' && post.generated_text && (
        <div className="flex flex-col gap-4">
          <div className="bg-muted/50 rounded-lg p-6">
            <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {post.generated_text}
            </pre>
          </div>
          <p className="text-muted-foreground text-xs">
            [사진 N] 위치에 순서대로 사진을 첨부해주세요.
          </p>
        </div>
      )}

      {post.status === 'draft' && (
        <p className="text-muted-foreground text-sm">
          글 생성에 실패했어요. 다시 시도해주세요.
        </p>
      )}
    </div>
  )
}
