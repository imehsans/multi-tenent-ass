/**
 * Create Organization Page
 *
 * Form to create a new organization with auto-generated slug.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import slugify from 'slugify';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(slugify(value, { lower: true, strict: true }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) return;

    // Validate name is not empty
    if (!name || name.trim().length < 2) {
      setError('Organization name must be at least 2 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());

      const org = await createOrganization(formData);

      // Redirect to new organization's tickets page
      router.push(`/orgs/${org.id}/tickets`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      setIsLoading(false); // Only reset on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create new organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You'll be the owner of this organization
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Organization name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Acme Inc"
              helperText="This will be visible to all members"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Slug (URL)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  /orgs/
                </span>
                <input
                  type="text"
                  value={slug}
                  readOnly
                  className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Auto-generated from organization name</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              key={isLoading ? 'loading' : 'idle'}
              type="submit"
              isLoading={isLoading}
              disabled={!name}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
