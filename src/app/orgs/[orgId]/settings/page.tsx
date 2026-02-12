import { getOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrgSettingsForm } from '@/components/OrgSettingsForm';

interface PageProps {
  params: Promise<{ orgId: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { orgId } = await params;
  const org = await getOrganization(orgId);
   const { hasPermission } = await import('@/lib/permissions');

   const canUpdate = await hasPermission(orgId, 'org.update');
   const canDelete = await hasPermission(orgId, 'org.delete');

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
              <OrgSettingsForm org={org} canUpdate={canUpdate} canDelete={canDelete} />
        </div>
      </div>
    </div>
  );
}
