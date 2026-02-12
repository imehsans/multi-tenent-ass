/**
 * Organization Context
 *
 * Manages organization state across the application.
 * CRITICAL: Safe org switching with full page refresh to prevent data leaks.
 *
 * See: docs/frontend.md - Step 3: Organization Context
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getUserOrganizations } from '@/lib/actions/organizations';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at?: string;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  isLoading: boolean;
  error: string | null;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
   const pathname = usePathname();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

   // Sync currentOrg with URL when pathname or organizations change
   useEffect(() => {
      if (organizations.length === 0) return;

      // Extract orgId from pathname: /orgs/[orgId]/...
      const match = pathname?.match(/\/orgs\/([^/]+)/);
      const urlOrgId = match?.[1];

      if (urlOrgId) {
         // Find the org that matches the URL
         const orgFromUrl = organizations.find((org) => org.id === urlOrgId);
         if (orgFromUrl && orgFromUrl.id !== currentOrg?.id) {
            setCurrentOrg(orgFromUrl);
         }
      } else if (!currentOrg && organizations.length > 0) {
         // Auto-select first org if not on an org page
         setCurrentOrg(organizations[0]);
      }
   }, [pathname, organizations, currentOrg?.id]);

  async function loadOrganizations() {
    setIsLoading(true);
    setError(null);
    try {
      const orgs = await getUserOrganizations();
       setOrganizations(orgs);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshOrganizations() {
    await loadOrganizations();
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        setCurrentOrg,
        isLoading,
        error,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
