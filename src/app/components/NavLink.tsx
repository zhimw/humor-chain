'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
}

export default function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`sidebar-nav-link${isActive ? ' active' : ''}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
