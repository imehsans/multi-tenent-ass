/**
 * Supabase Browser Client
 *
 * Provides an authenticated client for use within Client Components.
 * This client is safe to use in the browser as it only exposes the public URL and anon key.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
