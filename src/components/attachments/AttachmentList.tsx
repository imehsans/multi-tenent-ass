'use client';

import { getAttachmentUrl, deleteAttachment } from '@/lib/actions/attachments';
import { useRouter } from 'next/navigation';
import { PaperClipIcon, TrashIcon } from '@heroicons/react/20/solid';

import { useRealtimeAttachments } from '@/hooks/useRealtimeAttachments';

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  created_at: string;
  uploaded_by: string; // ID
}

interface AttachmentListProps {
  ticketId: string;
  initialAttachments: Attachment[];
}

export function AttachmentList({ ticketId, initialAttachments }: AttachmentListProps) {
  const router = useRouter();
  const attachments = useRealtimeAttachments(ticketId, initialAttachments);

  const handleDownload = async (attachmentId: string) => {
    try {
      const url = await getAttachmentUrl(attachmentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteAttachment(attachmentId);
      router.refresh(); // Refresh list via server component re-render
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete file.');
    }
  };

  if (!attachments || attachments.length === 0) {
    return <p className="text-sm text-gray-500 italic">No attachments.</p>;
  }

  return (
    <ul role="list" className="divide-y divide-gray-200 rounded-md border border-gray-200">
      {attachments.map((file) => (
        <li key={file.id} className="flex items-center justify-between py-3 pr-4 pl-3 text-sm">
          <div className="flex w-0 flex-1 items-center">
            <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <span className="ml-2 w-0 flex-1 truncate">{file.file_name}</span>
            <span className="ml-2 text-xs text-gray-400">
              {(file.file_size / 1024).toFixed(0)} KB
            </span>
          </div>
          <div className="ml-4 flex flex-shrink-0 gap-2">
            <button
              onClick={() => handleDownload(file.id)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Download
            </button>
            <button
              onClick={() => handleDelete(file.id)}
              className="text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
