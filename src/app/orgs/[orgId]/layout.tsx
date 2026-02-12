/**
 * Organization Dashboard Layout
 *
 * Includes sidebar navigation for managing tickets, members, and settings.
 * Only applies to routes under /orgs/[orgId].
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button'; // Can be used for nav items styling if needed
import { ReactNode } from 'react';
import {
  HomeIcon,
  UsersIcon,
  CogIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'; // Using outline for nav

// Helper to check active state (client side) - wait, this is server component.
// We can use a client component for navigation links to highlight active state.

import { NavLink } from '@/components/NavLink'; // I'll need to create this simple component

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function OrgDashboardLayout({ children, params }: DashboardLayoutProps) {
  const { orgId } = await params;

  const navigation = [
    { name: 'Tickets', href: `/orgs/${orgId}/tickets`, icon: HomeIcon },
    { name: 'Members', href: `/orgs/${orgId}/members`, icon: UsersIcon },
    { name: 'Audit Log', href: `/orgs/${orgId}/audit`, icon: ClipboardDocumentListIcon },
    { name: 'Settings', href: `/orgs/${orgId}/settings`, icon: CogIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Dark Modern Theme */}
      <div className="hidden border-r border-slate-800 bg-slate-900 md:fixed md:inset-y-0 md:top-16 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                activeClassName="bg-slate-800 text-white"
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0 transition-colors group-hover:text-white"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-800 pt-4">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workspace
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                {/* Placeholder for workspace stats or similar */}
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-full flex-1 flex-col md:pl-64">
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
