'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getInviteByToken, acceptInvite } from '@/lib/actions/invites';
import { createClient } from '@/lib/supabase/client';

interface InviteDetails {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AcceptInviteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndInvite = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      // Check authentication status
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch invite details
      const result = await getInviteByToken(token);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setInvite(result.invite as InviteDetails);
      setLoading(false);
    };

    checkAuthAndInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const result = await acceptInvite(token);

      if (result.success) {
        // Redirect to organization
        router.push(`/orgs/${result.org_id}/tickets`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    // Redirect to login with return URL
    router.push(`/auth/login?redirect=/auth/accept-invite?token=${token}`);
  };

  const handleSignup = () => {
    // Redirect to signup with invite email pre-filled
    router.push(
      `/auth/signup?email=${encodeURIComponent(invite?.email || '')}&redirect=/auth/accept-invite?token=${token}`
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 py-12 shadow">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 py-12 shadow">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Invalid Invitation</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is not authenticated
  if (!user) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-8 py-12 shadow">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            You&apos;re Invited!
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-md bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-700">Organization</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{invite.organizations.name}</p>
            </div>
            <div className="rounded-md bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-700">Your Role</p>
              <p className="mt-1 text-lg font-semibold capitalize text-gray-900">{invite.role}</p>
            </div>
            <div className="rounded-md bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-700">Invited Email</p>
              <p className="mt-1 text-sm text-gray-900">{invite.email}</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-600">
            Please sign in or create an account to accept this invitation
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleLogin}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Sign In
            </button>
            <button
              onClick={handleSignup}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated - show accept button
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg bg-white px-8 py-12 shadow">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Accept Invitation</h2>
        <div className="mt-6 space-y-4">
          <div className="rounded-md bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Organization</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{invite.organizations.name}</p>
          </div>
          <div className="rounded-md bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Your Role</p>
            <p className="mt-1 text-lg font-semibold capitalize text-gray-900">{invite.role}</p>
          </div>
          <div className="rounded-md bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">Signed in as</p>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          {user.email?.toLowerCase() !== invite.email.toLowerCase() && (
            <div className="rounded-md bg-yellow-50 px-4 py-3">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-yellow-700">
                  Warning: This invitation was sent to <strong>{invite.email}</strong>, but you are
                  signed in as <strong>{user.email}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accepting ? (
              <span className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Accepting...
              </span>
            ) : (
              'Accept Invitation'
            )}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
