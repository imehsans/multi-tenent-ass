'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';

export function OrgSwitcher() {
  const router = useRouter();
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();

  const handleOrgSwitch = (org: any) => {
    setCurrentOrg(org);
    window.location.href = `/orgs/${org.id}/tickets`;
  };

  if (!currentOrg) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <span className="max-w-[200px] truncate">{currentOrg.name}</span>
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="ring-opacity-5 absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
              Your Organizations
            </div>
            {organizations.map((org) => (
              <Menu.Item key={org.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleOrgSwitch(org)}
                    className={` ${active ? 'bg-gray-100' : ''} ${currentOrg.id === org.id ? 'bg-blue-50' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-900`}
                  >
                    <span className="flex-1 truncate">{org.name}</span>
                    {currentOrg.id === org.id && (
                      <CheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    )}
                    <span className="ml-2 text-xs text-gray-500 capitalize">{org.role}</span>
                  </button>
                )}
              </Menu.Item>
            ))}

            <div className="my-1 border-t border-gray-100" />

            <Menu.Item>
              {({ active }) => (
                <a
                  href="/orgs/new"
                  className={` ${active ? 'bg-gray-100' : ''} group flex w-full items-center px-4 py-2 text-sm font-medium text-blue-600`}
                >
                  + Create new organization
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
