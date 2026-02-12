import { Suspense } from 'react';
import AcceptInviteClient from './AcceptInviteClient';

export const metadata = {
  title: 'Accept Invitation',
  description: 'Join your organization',
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md">
            <div className="rounded-lg bg-white px-8 py-12 shadow">
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">Loading invitation...</p>
            </div>
          </div>
        }
      >
        <AcceptInviteClient />
      </Suspense>
    </div>
  );
}
