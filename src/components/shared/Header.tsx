import { InventoryModeModal } from '@/features/inventory/components/inventory-mode-modal';

export function Header() {
  return (
    <header className="h-16 border-b bg-white dark:bg-gray-950 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        {/* Aquí irá el buscador global */}
        <input 
          id="global-search-input"
          type="text" 
          placeholder="Buscar inventario (Ctrl/Cmd + K)" 
          className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-4">
        <InventoryModeModal />
      </div>
    </header>
  );
}
