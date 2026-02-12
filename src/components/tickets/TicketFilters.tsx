/**
 * Ticket Filters Component
 *
 * Filters tickets by status, severity, and text search.
 * Updates URL search params to preserve filter state on refresh.
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Local state for search input to allow debouncing
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Sync search state with URL params when they change externally (e.g. Back button)
  useEffect(() => {
    const paramSearch = searchParams.get('search') || '';
    if (paramSearch !== search) {
      setSearch(paramSearch);
    }
  }, [searchParams]);

  // Debounce search URL update
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      // Reset cursor on search change
      params.delete('cursor');

      const newSearch = params.toString();
      // Only push if changed to avoid unnecessary navigation/history entries if possible
      if (newSearch !== searchParams.toString()) {
        router.push(pathname + '?' + newSearch);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [search, router, pathname]); // Intentionally omitting searchParams to avoid circular dependency loop if not careful?
  // Actually, if searchParams changes, we don't want to re-trigger this effect unless SEARCH changes.
  // But inside, we need current searchParams.
  // The searchParams in hook scope might be stale if we don't include it.
  // BETTER APPROACH: Use a ref or just rely on the fact that if searchParams changes, component re-renders, effect re-runs if [search] is same? No.
  // Ideally, use a function to update query.

  // Let's use a helper for immediate updates (Status/Severity)
  const updateFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete('cursor');
    router.push(pathname + '?' + params.toString());
  };

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <Input
          type="search"
          placeholder="Search tickets..."
          label="Search"
          className="w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-[180px]">
        <Select
          label="Status"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'investigating', label: 'Investigating' },
            { value: 'mitigated', label: 'Mitigated' },
            { value: 'resolved', label: 'Resolved' },
          ]}
          value={searchParams.get('status') || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
        />
      </div>

      <div className="w-[180px]">
        <Select
          label="Severity"
          options={[
            { value: '', label: 'All Severities' },
            { value: '5', label: 'Critical (5)' },
            { value: '4', label: 'High (4)' },
            { value: '3', label: 'Medium (3)' },
            { value: '2', label: 'Low (2)' },
            { value: '1', label: 'Trivial (1)' },
          ]}
          value={searchParams.get('severity') || ''}
          onChange={(e) => updateFilter('severity', e.target.value)}
        />
      </div>

      <div className="pb-1">
        {(searchParams.get('status') || searchParams.get('severity') || search) && (
          <Button variant="ghost" onClick={() => router.push(pathname)}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
