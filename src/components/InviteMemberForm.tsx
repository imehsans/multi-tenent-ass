/**
 * Invite Member Form Component
 *
 * Instantly adds users to organization.
 * - If user exists: Adds directly
 * - If user doesn't exist: Creates with password 12345678
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createInvite } from '@/lib/actions/invites';
import { Select } from '@/components/ui/Select';

interface InviteMemberFormProps {
  orgId: string;
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState(false);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const result = await createInvite({
        email,
        role,
        org_id: orgId,
      });

      if (result.success) {
        setSuccessMessage(result.message);
        setUserCreated(result.user.created || false);
        setEmail('');
        router.refresh(); // Refresh to show new member in list
      }
    } catch (error) {
      console.error('Invite failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSuccessMessage(null);
    setEmail('');
    setRole('member');
    setUserCreated(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Invite Member</Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={successMessage ? 'Member Added!' : 'Invite New Member'}
        footer={
          successMessage ? (
            <div className="flex justify-end gap-2">
              <Button onClick={handleClose}>Done</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInvite} isLoading={isSubmitting}>
                  Add Member
                </Button>
              </div>
            )
        }
      >
        {successMessage ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {userCreated ? 'User created and added!' : 'User added successfully!'}
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    {successMessage}
                  </p>
                  {userCreated && (
                    <div className="mt-3 rounded-md bg-blue-50 p-3 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">
                        📧 Default Credentials
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        Password: <span className="font-mono font-bold">12345678</span>
                      </p>
                      <p className="mt-1 text-xs text-blue-600">
                        The user can login immediately with these credentials. They should change their password after first login.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                helperText="If user doesn't exist, they'll be created with password: 12345678"
              />

              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                options={[
                  { value: 'viewer', label: 'Viewer - Can view tickets' },
                  { value: 'member', label: 'Member - Can create and comment' },
                  { value: 'admin', label: 'Admin - Can manage members and settings' },
                  { value: 'owner', label: 'Owner - Full access' },
                ]}
              />

              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  ℹ️ The user will be added immediately. If their account doesn't exist, it will be created with the default password <span className="font-mono font-semibold">12345678</span>.
                </p>
              </div>
            </form>
        )}
      </Modal>
    </>
  );
}
