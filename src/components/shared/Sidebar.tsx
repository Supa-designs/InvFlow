'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { ChartLineIcon } from '@/components/ui/chart-line';
import { BoxesIcon } from '@/components/ui/boxes';
import { BookTextIcon } from '@/components/ui/book-text';
import { LayersIcon } from '@/components/ui/layers';
import { SearchIcon } from '@/components/ui/search';
import { SettingsIcon } from '@/components/ui/settings';
import { UsersIcon } from '@/components/ui/users';
import { ArrowLeftRight } from 'lucide-react';
import type { ChartLineIconHandle } from '@/components/ui/chart-line';
import type { BoxesIconHandle } from '@/components/ui/boxes';
import type { BookTextIconHandle } from '@/components/ui/book-text';
import type { LayersIconHandle } from '@/components/ui/layers';
import type { SearchIconHandle } from '@/components/ui/search';
import type { SettingsIconHandle } from '@/components/ui/settings';
import type { UsersIconHandle } from '@/components/ui/users';

type SidebarIconHandle =
  | SearchIconHandle
  | ChartLineIconHandle
  | BoxesIconHandle
  | BookTextIconHandle
  | LayersIconHandle
  | SettingsIconHandle
  | UsersIconHandle;

function SidebarItem({
  href,
  active,
  icon,
  label,
  onHoverChange,
}: {
  href: string;
  active?: boolean;
  icon: ReactNode;
  label: string;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const activeClass = active ? 'bg-[#E9E9E9] rounded-[14px]' : 'rounded-none';

  return (
    <Link
      href={href}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`flex items-center gap-2 px-3 py-2 text-[8px] font-normal leading-4 tracking-[-0.01em] transition-colors hover:bg-[#E9E9E9] dark:hover:bg-gray-800 ${activeClass}`}
    >
      {icon}
      <span className="text-sm font-normal">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { is } = useTenantFeatures();
  const pathname = usePathname();
  const dashboardIconRef = useRef<SidebarIconHandle | null>(null);
  const productsIconRef = useRef<SidebarIconHandle | null>(null);
  const categoriesIconRef = useRef<SidebarIconHandle | null>(null);
  const movementsIconRef = useRef<SidebarIconHandle | null>(null);
  const auditIconRef = useRef<SidebarIconHandle | null>(null);
  const membersIconRef = useRef<SidebarIconHandle | null>(null);
  const settingsIconRef = useRef<SidebarIconHandle | null>(null);
  const searchIconRef = useRef<SidebarIconHandle | null>(null);
  const openGlobalSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("invflow:open-global-search"));
    }
  };

  return (
    <aside
      style={{ backgroundColor: '#fafafa' }}
      className="m-2 flex h-[calc(100%-1rem)] w-64 flex-col px-2 py-3 [&_a]:rounded-none [&_button]:rounded-none [&_button]:font-normal dark:!bg-gray-950/80"
    >
      <div className="px-2 pb-4 pt-1.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 [&_button]:w-full [&_button]:max-w-full">
            <OrganizationSwitcher hidePersonal={true} />
          </div>
          <button
            type="button"
            aria-label="Abrir búsqueda"
            onClick={openGlobalSearch}
            onMouseEnter={() => searchIconRef.current?.startAnimation()}
            onMouseLeave={() => searchIconRef.current?.stopAnimation()}
            className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-black/5"
          >
            <SearchIcon ref={searchIconRef as never} size={16} className="shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SidebarItem
          href="/dashboard"
          active={pathname === '/dashboard'}
          onHoverChange={(hovered) => (hovered ? dashboardIconRef.current?.startAnimation() : dashboardIconRef.current?.stopAnimation())}
          icon={<ChartLineIcon ref={dashboardIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
          label="Dashboard"
        />
        <SidebarItem
          href="/products"
          active={pathname === '/products'}
          onHoverChange={(hovered) => (hovered ? productsIconRef.current?.startAnimation() : productsIconRef.current?.stopAnimation())}
          icon={<BoxesIcon ref={productsIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
          label="Productos"
        />
        {is('categories') && (
          <SidebarItem
            href="/categories"
            active={pathname === '/categories'}
            onHoverChange={(hovered) => (hovered ? categoriesIconRef.current?.startAnimation() : categoriesIconRef.current?.stopAnimation())}
            icon={<LayersIcon ref={categoriesIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
            label="Categorías"
          />
        )}
        {is('movements') && (
          <SidebarItem
            href="/movements"
            active={pathname === '/movements'}
            onHoverChange={(hovered) => (hovered ? movementsIconRef.current?.startAnimation() : movementsIconRef.current?.stopAnimation())}
            icon={<ArrowLeftRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
            label="Movimientos"
          />
        )}
        <SidebarItem
          href="/audit"
          active={pathname === '/audit'}
          onHoverChange={(hovered) => (hovered ? auditIconRef.current?.startAnimation() : auditIconRef.current?.stopAnimation())}
          icon={<BookTextIcon ref={auditIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
          label="Audit log"
        />
      </nav>
      <div className="space-y-2 px-2 pb-1 pt-2">
        <SidebarItem
          href="/members"
          active={pathname === '/members'}
          onHoverChange={(hovered) => (hovered ? membersIconRef.current?.startAnimation() : membersIconRef.current?.stopAnimation())}
          icon={<UsersIcon ref={membersIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
          label="Miembros"
        />
        <SidebarItem
          href="/settings"
          active={pathname === '/settings'}
          onHoverChange={(hovered) => (hovered ? settingsIconRef.current?.startAnimation() : settingsIconRef.current?.stopAnimation())}
          icon={<SettingsIcon ref={settingsIconRef as never} size={16} className="shrink-0 text-muted-foreground" />}
          label="Configuración"
        />
        <div className="mt-4 w-full px-3 [&_button]:w-full [&_button]:justify-start">
          <UserButton showName />
        </div>
      </div>
    </aside>
  );
}
