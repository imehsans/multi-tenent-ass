/**
 * Organization Settings Form
 *
 * Allows owners to update organization details or delete the organization.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updateOrganization, deleteOrganization } from '@/lib/actions/organizations';

interface OrgSettingsFormProps {
  org: {
    id: string;
    name: string;
    slug: string;
  };
  canUpdate: boolean;
  canDelete: boolean;
}

export function OrgSettingsForm({ org, canUpdate, canDelete }: OrgSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;

    setIsUpdating(true);
    try {
      await updateOrganization(org.id, { name });
      router.refresh();
      alert('Organization updated successfully');
    } catch (error) {
      console.error('Failed to update organization:', error);
      alert('Failed to update organization');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    
    const confirmMessage = `Are you absolutely sure? This action cannot be undone.\n\nType "${org.slug}" to confirm.`;
    const userInput = prompt(confirmMessage);

    if (userInput !== org.slug) {
      if (userInput) alert('Confirmation failed. Organization name did not match.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrganization(org.id);
      router.push('/orgs');
    } catch (error) {
      console.error('Failed to delete organization:', error);
      alert('Failed to delete organization: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Update Form */}
      <div className="shadow sm:overflow-hidden sm:rounded-md">
        <div className="bg-white px-4 py-5 sm:p-6 space-y-6">
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canUpdate || isUpdating}
                    className="block w-full text-gray-800 px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={org.slug}
                    disabled
                    className="block w-full text-gray-800 px-4 py-2  rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Slug serves as the permanent identifier URL and cannot be changed.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" isLoading={isUpdating} disabled={!canUpdate || name === org.name}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Section */}
      {canDelete && (
        <div className="shadow sm:overflow-hidden sm:rounded-md border border-red-200">
          <div className="bg-red-50 px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-red-800">Danger Zone</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Once you delete an organization, there is no going back. Please be certain.
              </p>
            </div>
            <div className="mt-5">
              <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                Delete Organization
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
