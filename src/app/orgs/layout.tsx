import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { Navbar } from '@/components/Navbar';

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <div className="h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
      </div>
    </OrganizationProvider>
  );
}
