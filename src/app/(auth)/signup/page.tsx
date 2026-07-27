import { SignupForm } from '@/components/features/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            계정을 만들어 시작하세요
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
