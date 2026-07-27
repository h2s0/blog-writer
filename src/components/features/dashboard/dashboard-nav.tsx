'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { logout } from '@/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface DashboardNavProps {
  user: User
}

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/posts', label: '내 글' },
  { href: '/settings', label: '말투 설정' },
]

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="border-border/40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold">
            블로그 작가
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  pathname === href
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs">
                {user.email?.[0].toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/settings')}>
              설정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => logout()}
            >
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
