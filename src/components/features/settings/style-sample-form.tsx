'use client'

import { useActionState, useRef } from 'react'
import { addStyleSample } from '@/actions/style-sample'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FormState {
  error?: string
}

export function StyleSampleForm() {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, action, pending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await addStyleSample(formData)
      if (!result?.error) formRef.current?.reset()
      return result ?? {}
    },
    {}
  )

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">내 블로그 글 샘플 붙여넣기</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="기존에 직접 쓴 블로그 글을 붙여넣으세요. 최소 100자 이상."
          rows={8}
          required
        />
        <p className="text-muted-foreground text-xs">
          AI가 이 글의 말투와 문체를 학습합니다. 실제로 본인이 쓴 글일수록 좋아요.
        </p>
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? '저장 중...' : '샘플 추가'}
      </Button>
    </form>
  )
}
