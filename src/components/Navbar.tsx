'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrgSwitcher } from './OrgSwitcher';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/Button';

export function Navbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orgs" className="flex items-center gap-2 text-xl font-bold text-gray-900 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <span className="hidden sm:inline-block">TicketSystem</span>
            </Link>
            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <OrgSwitcher />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleSignOut} className="text-gray-500 hover:text-gray-900">
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

}
