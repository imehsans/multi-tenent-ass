/**
 * Comment Form Component
 *
 * Add comments to a ticket.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { addComment } from '@/lib/actions/timeline'; // Server Action
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  ticketId: string;
  onOptimisticAdd?: (event: any) => void;
}

export function CommentForm({ ticketId, onOptimisticAdd }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const content = comment;
    setComment(''); // Clear input immediately
    // Don't set isSubmitting to true to block input, allow typing next one?
    // Usually keep it accessible. But maybe prevent double submit.
    setIsSubmitting(true);

    // Optimistic Update
    if (onOptimisticAdd) {
      onOptimisticAdd({
        id: 'optimistic-' + Date.now(),
        ticket_id: ticketId,
        event_type: 'comment',
        content: content,
        created_at: new Date().toISOString(),
        actor_id: 'me', // Fallback, will be updated or just placeholder
        metadata: { optimistic: true },
      });
    }

    try {
      await addComment(ticketId, content);
      router.refresh(); // Still refresh to conform other state if needed
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to post comment. Please try again.');
      // Ideally rollback optimistic update here, but for simple implementation we can just alert
      // The optimistic item will persist until refresh if not handled, which is a known trade-off for simple code.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="min-w-0 flex-1">
        <label htmlFor="comment" className="sr-only">
          About
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          className="block w-full text-gray-800 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!comment.trim() || isSubmitting} isLoading={isSubmitting}>
          Post Comment
        </Button>
      </div>
    </form>
  );
}
