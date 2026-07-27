'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormState {
  error?: string
}

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await signup(formData)
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
          placeholder="8자 이상"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '가입 중...' : '회원가입'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          로그인
        </Link>
      </p>
    </form>
  )
}
