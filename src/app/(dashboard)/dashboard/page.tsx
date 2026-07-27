import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import type { Subscription } from '@/types/database'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: postCount }, subscriptionResult] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('subscriptions').select('*').eq('user_id', user!.id).single(),
  ])

  const subscription = subscriptionResult.data as Subscription | null
  const MAX_FREE = 3
  const usedCount = subscription?.generation_count_this_month ?? 0
  const remaining = Math.max(0, MAX_FREE - usedCount)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="대시보드"
        description="이번 달 글 생성 현황"
      >
        <Link href="/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              이번 달 생성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usedCount}회</p>
            <p className="text-muted-foreground text-xs mt-1">
              무료 {MAX_FREE}회 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              남은 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{remaining}회</p>
            <p className="text-muted-foreground text-xs mt-1">
              {subscription?.plan === 'pro' ? 'Pro 플랜' : '무료 플랜'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              전체 생성 글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{postCount ?? 0}개</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">빠른 시작</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="hover:border-foreground/30 cursor-pointer transition-colors">
            <Link href="/posts/new" className="block">
              <CardContent className="pt-6">
                <p className="font-medium">새 글 작성</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  사진과 정보를 입력하면 글을 써드려요
                </p>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover:border-foreground/30 cursor-pointer transition-colors">
            <Link href="/settings" className="block">
              <CardContent className="pt-6">
                <p className="font-medium">말투 설정</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  내 블로그 글 샘플을 등록하세요
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
