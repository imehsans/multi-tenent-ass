'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  activeClassName?: string;
}

export function NavLink({
  href,
  className = '',
  children,
  activeClassName = 'bg-gray-100 text-gray-900',
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? activeClassName : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      {children}
    </Link>
  );
}
