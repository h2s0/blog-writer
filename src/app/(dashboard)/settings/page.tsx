import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { StyleSampleList } from '@/components/features/settings/style-sample-list'
import { StyleSampleForm } from '@/components/features/settings/style-sample-form'
import { MAX_STYLE_SAMPLES } from '@/constants'
import type { StyleSample } from '@/types/database'

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('style_samples')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const samples = (data ?? []) as StyleSample[]
  const canAdd = samples.length < MAX_STYLE_SAMPLES

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="말투 설정"
        description="내 블로그 글 샘플을 등록하면 AI가 내 말투를 학습해요"
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">등록된 샘플</h2>
          <span className="text-muted-foreground text-sm">
            {samples.length} / {MAX_STYLE_SAMPLES}개
          </span>
        </div>
        <StyleSampleList samples={samples} />
      </div>

      {canAdd && (
        <>
          <Separator />
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">샘플 추가</h2>
            <StyleSampleForm />
          </div>
        </>
      )}

      {!canAdd && (
        <p className="text-muted-foreground text-sm">
          샘플이 {MAX_STYLE_SAMPLES}개 등록되어 있어요. 새로 추가하려면 기존 샘플을 삭제해주세요.
        </p>
      )}
    </div>
  )
}
