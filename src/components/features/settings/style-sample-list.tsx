'use client'

import { useTransition } from 'react'
import { deleteStyleSample } from '@/actions/style-sample'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { StyleSample } from '@/types/database'

interface StyleSampleListProps {
  samples: StyleSample[]
}

export function StyleSampleList({ samples }: StyleSampleListProps) {
  const [pending, startTransition] = useTransition()

  if (samples.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        아직 등록된 샘플이 없어요. 아래에서 추가해보세요.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {samples.map((sample, index) => (
        <Card key={sample.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground mb-1 text-xs">샘플 {index + 1}</p>
                <p className="line-clamp-3 text-sm whitespace-pre-line">
                  {sample.content}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {sample.content.length}자
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => { await deleteStyleSample(sample.id) })
                }
              >
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
