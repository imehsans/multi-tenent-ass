/**
 * Organizations Layout
 *
 * Wraps all /orgs routes with OrganizationProvider.
 * Ensures organization state is available throughout the dashboard.
 */

import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { Navbar } from '@/components/Navbar';

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
      </div>
    </OrganizationProvider>
  );
}
