import { redirect } from 'next/navigation'

// TODO: 출시 전 인증 체크 복구
export default function RootPage() {
  redirect('/dashboard')
}
