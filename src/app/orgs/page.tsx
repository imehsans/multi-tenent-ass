/**
 * Organizations List Page
 *
 * Shows all organizations the user belongs to.
 * Allows creating new organizations.
 */

import { getUserOrganizations } from '@/lib/actions/organizations';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function OrganizationsPage() {
  const organizations = await getUserOrganizations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Organizations</h1>
            <p className="mt-2 text-gray-600">
              Select an organization to access its tickets and settings
            </p>
          </div>
          <Link href="/orgs/new">
            <Button>+ Create Organization</Button>
          </Link>
        </div>

        {organizations.length === 0 ? (
          <EmptyState
            title="No organizations yet"
            description="Create your first organization to start managing tickets"
            actionLabel="Create Organization"
            actionHref="/orgs/new"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org: any) => (
              <Link
                key={org.id}
                href={`/orgs/${org.id}/tickets`}
                className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                    {org.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
