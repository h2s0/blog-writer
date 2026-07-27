'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormState {
  error?: string
}

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await login(formData)
      return result ?? {}
    },
    {}
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="example@email.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="비밀번호 입력"
          required
          autoComplete="current-password"
        />
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '로그인 중...' : '로그인'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </form>
  )
}
