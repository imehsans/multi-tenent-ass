/**
 * Authentication Middleware
 *
 * Implements authentication and route protection using @supabase/ssr.
 * - Handles session refresh via cookies
 * - Protects /orgs routes (redirects to /auth/login)
 * - Redirects authenticated users from /auth pages to /orgs
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require authentication
  if (!user && request.nextUrl.pathname.startsWith('/orgs')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/orgs', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Copy cookies from the refreshed response to the redirect response
    // ensuring the new session (if refreshed) is persisted
    const cookiesToSet = response.cookies.getAll();
    cookiesToSet.forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
