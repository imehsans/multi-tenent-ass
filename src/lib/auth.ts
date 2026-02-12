/**
 * Authentication Helper Functions
 *
 * Provides utility functions for verifying user authentication in Server Components and Server Actions.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Get current authenticated user
 * Returns User object or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication
 * Redirects to /auth/login if not authenticated
 * Returns User object if authenticated
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

/**
 * Get current session
 * Returns Session object or null if no active session
 */
export async function getCurrentSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
