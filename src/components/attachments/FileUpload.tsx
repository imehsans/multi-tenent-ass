/**
 * File Upload Component
 *
 * Uploads files to Supabase Storage via Server Action.
 */

'use client';

import { useState } from 'react';
import { uploadAttachment } from '@/lib/actions/attachments';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface FileUploadProps {
  orgId: string;
  ticketId: string;
}

export function FileUpload({ orgId, ticketId }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticket_id', ticketId);
      formData.append('org_id', orgId);

      await uploadAttachment(formData);
      router.refresh();
      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">Attachments</label>
      <div className="mt-1 flex items-center">
        <label
          htmlFor="file-upload"
          className={`cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {isUploading ? 'Uploading...' : 'Upload file'}
        </label>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
