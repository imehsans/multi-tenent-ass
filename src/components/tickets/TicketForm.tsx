/**
 * Ticket Form Component
 *
 * Create or Edit tickets.
 * Integrates with Server Actions, validation, and loading states.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket, updateTicket, TicketStatus } from '@/lib/actions/tickets';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface TicketFormProps {
  orgId: string;
  initialData?: any; // If editing
  isEdit?: boolean;
}

export function TicketForm({ orgId, initialData, isEdit = false }: TicketFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [severity, setSeverity] = useState(initialData?.severity?.toString() || '3');
  const [status, setStatus] = useState<TicketStatus>(initialData?.status || 'open');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateTicket(initialData.id, {
          title,
          description,
          severity: parseInt(severity),
          status,
        });
        router.refresh();
      } else {
        await createTicket({
          org_id: orgId,
          title,
          description,
          severity: parseInt(severity),
        });
        router.push(`/orgs/${orgId}/tickets`);
        router.refresh(); // Ensure list updates
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Brief summary of the issue"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="min-h-[120px] text-gray-800 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed explanation..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: '5', label: 'Critical (5)' },
              { value: '4', label: 'High (4)' },
              { value: '3', label: 'Medium (3)' },
              { value: '2', label: 'Low (2)' },
              { value: '1', label: 'Trivial (1)' },
            ]}
          />

          {isEdit && (
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'investigating', label: 'Investigating' },
                { value: 'mitigated', label: 'Mitigated' },
                { value: 'resolved', label: 'Resolved' },
              ]}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={!title}>
          {isEdit ? 'Update Ticket' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}
