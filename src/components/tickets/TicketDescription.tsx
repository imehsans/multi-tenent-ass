'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateTicket } from '@/lib/actions/tickets';
import { useRouter } from 'next/navigation';

interface TicketDescriptionProps {
  ticketId: string;
  description: string | null;
  canUpdate: boolean;
}

export function TicketDescription({ ticketId, description, canUpdate }: TicketDescriptionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTicket(ticketId, { description: value });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to update description:', error);
      alert('Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[150px]"
          placeholder="Add a description..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
        {description || <span className="text-gray-400 italic">No description provided.</span>}
      </div>
      
      {canUpdate && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      )}
    </div>
  );
}
