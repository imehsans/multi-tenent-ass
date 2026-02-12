'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
}

interface OrganizationsClientProps {
  organizations: Organization[];
}

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function OrganizationsClient({ organizations }: OrganizationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filter and search organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      // Search filter
      const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === 'all' || org.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [organizations, searchQuery, roleFilter]);

  // Count organizations by role
  const roleCounts = useMemo(() => {
    return organizations.reduce(
      (counts, org) => {
        counts[org.role] = (counts[org.role] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
  }, [organizations]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: `All (${organizations.length})` },
              { value: 'owner', label: `Owner (${roleCounts.owner || 0})` },
              { value: 'admin', label: `Admin (${roleCounts.admin || 0})` },
              { value: 'member', label: `Member (${roleCounts.member || 0})` },
              { value: 'viewer', label: `Viewer (${roleCounts.viewer || 0})` },
            ]}
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredOrganizations.length} of {organizations.length} organizations
      </div>

      {/* Organizations Grid */}
      {filteredOrganizations.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No organizations found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || roleFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first organization to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((org) => (
            <Link
              key={org.id}
              href={`/orgs/${org.id}/tickets`}
              className="group block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {org.name}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                    ROLE_COLORS[org.role]
                  }`}
                >
                  {org.role}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Created {new Date(org.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
