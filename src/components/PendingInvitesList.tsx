'use client';

import { useState } from 'react';
import { cancelInvite } from '@/lib/actions/invites';
import { formatDistanceToNow } from 'date-fns';

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface PendingInvitesListProps {
  invites: Invite[];
  orgId: string;
}

export function PendingInvitesList({ invites, orgId }: PendingInvitesListProps) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCancel = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    setCancelling(inviteId);
    try {
      await cancelInvite(inviteId);
      // Page will refresh via revalidatePath
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel invitation');
      setCancelling(null);
    }
  };

  const handleCopyLink = (token: string, inviteId: string) => {
    const inviteUrl = `${window.location.origin}/auth/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(inviteId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6"
            >
              Email
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Role
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Expires
            </th>
            <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {invites.map((invite) => {
            const isExpired = new Date(invite.expires_at) < new Date();
            return (
              <tr key={invite.id} className={isExpired ? 'opacity-50' : ''}>
                <td className="py-4 pr-3 pl-4 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{invite.email}</span>
                    {isExpired && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium capitalize text-yellow-800">
                    {invite.role}
                  </span>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {isExpired ? (
                    <span className="text-red-600">Expired</span>
                  ) : (
                    <span title={new Date(invite.expires_at).toLocaleString()}>
                      {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                    </span>
                  )}
                </td>
                <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleCopyLink(invite.token, invite.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Copy invitation link"
                    >
                      {copied === invite.id ? (
                        <span className="flex items-center">
                          <svg
                            className="mr-1 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copied
                        </span>
                      ) : (
                        'Copy Link'
                      )}
                    </button>
                    <button
                      onClick={() => handleCancel(invite.id)}
                      disabled={cancelling === invite.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {cancelling === invite.id ? 'Canceling...' : 'Cancel'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
