/**
 * Invite Member Form Component
 *
 * Uses Modal to show invite form.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { inviteMember } from '@/lib/actions/invites';
import { Select } from '@/components/ui/Select';

interface InviteMemberFormProps {
  orgId: string;
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('role', role);
      formData.append('org_id', orgId);

      await inviteMember(formData);
      setIsOpen(false);
      setEmail('');
      router.refresh();
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Invite failed:', error);
      alert('Failed to send invite. Please check permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Invite Member</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invite New Member"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} isLoading={isSubmitting}>
              Send Invite
            </Button>
          </div>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4 text-gray-800">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="colleague@example.com"
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'member', label: 'Member' },
              { value: 'viewer', label: 'Viewer' },
            ]}
          />
        </form>
      </Modal>
    </>
  );
}
