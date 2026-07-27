'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData): Promise<{ error: string } | never> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signup(formData: FormData): Promise<{ error: string } | never> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function logout(): Promise<never> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
