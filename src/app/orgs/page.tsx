import { getUserOrganizations } from '@/lib/actions/organizations';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrganizationsClient } from '@/components/OrganizationsClient';

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
            <OrganizationsClient organizations={organizations} />
        )}
      </div>
    </div>
  );
}
