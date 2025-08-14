import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

// Server component client
export const createSupabaseServerComponentClient = () => 
  createServerComponentClient<Database>({ cookies })