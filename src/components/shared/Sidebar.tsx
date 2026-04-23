'use client';

import Link from 'next/link';
import { Tag, ArrowLeftRight, Settings, Users } from 'lucide-react';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { ChartLineIcon } from '@/components/ui/chart-line';
import { BoxesIcon } from '@/components/ui/boxes';
import { BookTextIcon } from '@/components/ui/book-text';

export function Sidebar() {
  const { is } = useTenantFeatures();

  return (
    <aside className="w-64 border-r bg-gray-50/50 dark:bg-gray-900/50 flex flex-col h-full">
      <div className="border-b p-4">
        <div className="w-full [&_button]:w-full [&_button]:max-w-full">
          <OrganizationSwitcher hidePersonal={true} />
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChartLineIcon size={18} /> Dashboard
        </Link>
        <Link href="/products" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          <BoxesIcon size={18} /> Productos
        </Link>
        {is('categories') && (
          <Link href="/categories" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
            <Tag className="w-4 h-4" /> Categorías
          </Link>
        )}
        {is('movements') && (
          <Link href="/movements" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeftRight className="w-4 h-4" /> Movimientos
          </Link>
        )}
        <Link href="/audit" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          <BookTextIcon size={18} /> Audit log
        </Link>
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href="/members" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          <Users className="w-4 h-4" /> Miembros
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
          <Settings className="w-4 h-4" /> Configuración
        </Link>
        <div className="mt-4 w-full px-3 [&_button]:w-full [&_button]:justify-start">
          <UserButton showName />
        </div>
      </div>
    </aside>
  );
}
