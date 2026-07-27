import { createServerClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/features/dashboard/dashboard-nav'
import type { User } from '@supabase/supabase-js'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: 출시 전 인증 가드 복구
  // if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user as User} />
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
