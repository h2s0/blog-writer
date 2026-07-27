import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import type { Post } from '@/types/database'

const STATUS_LABEL: Record<Post['status'], string> = {
  draft: '작성 중',
  generating: '생성 중',
  done: '완료',
}

export default async function PostsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as Post[]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="내 글" description="생성한 블로그 글 목록">
        <Link href="/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </PageHeader>

      {posts.length === 0 ? (
        <EmptyState
          title="아직 작성한 글이 없어요"
          description="새 글 작성 버튼을 눌러 시작해보세요"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="hover:border-foreground/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {post.title || post.location || '제목 없음'}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {STATUS_LABEL[post.status]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
