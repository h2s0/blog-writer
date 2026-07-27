import { LoginForm } from '@/components/features/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            계정에 로그인하세요
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
