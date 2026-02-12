/**
 * Organization Settings Page
 *
 * Manage organization details.
 */

import { getOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PageProps {
  params: Promise<{ orgId: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { orgId } = await params;
  const org = await getOrganization(orgId);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Organization Profile</h3>
          <p className="mt-1 text-sm text-gray-500">
            This information will be displayed publicly to members of the organization.
          </p>
        </div>
        <div className="mt-5 md:col-span-2 md:mt-0">
          <form action="#" method="POST">
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={org.name}
                      disabled
                      className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Organization name cannot be changed (yet).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      defaultValue={org.slug}
                      disabled
                      className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <Button disabled>Save</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
