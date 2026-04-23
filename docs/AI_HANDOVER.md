# Contexto de Migración y Traspaso Técnico: invflow

Este documento sirve como memoria técnica para un nuevo agente de IA o desarrollador que tome el relevo en el proyecto **`invflow`**. Aquí se detalla el estado actual, la arquitectura y los pasos pendientes para completar la migración desde el proyecto legado `lovableinv`.

## 1. Stack Tecnológico de Referencia
- **Framework**: Next.js 16.2 (App Router).
- **Estilos**: Tailwind CSS 4 + Shadcn UI.
- **Autenticación y Multitenancy**: Clerk (Basado en Organizaciones).
- **Base de Datos**: PostgreSQL (Neon Serverless).
- **ORM**: Drizzle ORM.
- **Formularios**: `@tanstack/react-form` (TanStack Form).
- **Tablas**: `@tanstack/react-table` (TanStack Table).
- **Acciones**: `next-safe-action` (Middleware de sesión y tenantId).
- **Estado de URL**: `nuqs`.

## 2. Arquitectura de Archivos (Clave)

### Base de Datos (`src/lib/db`)
- `schema/public`: Tablas globales (Tenants, Invitations).
- `schema/tenant`: Tablas específicas de negocio (Products, Categories, Movements, Audit Logs).
- `index.ts`: Configuración del cliente de Neon.

### Funcionalidades (`src/features`)
Usamos un patrón modular por feature:
- `products/`: Acciones, repositorios, componentes de tabla y formularios de productos.
- `categories/`: CRUD de categorías.
- `movements/`: Historial de entradas y salidas de inventario.
- `audit/`: Servicio central de logs de auditoría.

### Rutas (`src/app`)
- `(dashboard)/`: Layout principal con Sidebar.
- `(dashboard)/settings`: Gestión de "Feature Flags" de la organización.
- `(dashboard)/members`: Gestión de miembros delegada a Clerk (`OrganizationProfile`).
- `(dashboard)/products`: Inventario central.
- `(dashboard)/categories`: Gestión de categorías.
- `(dashboard)/movements`: Log de transacciones históricas.

## 3. Estado de lo Implementado

### ✅ Completado
1. **Core Multitenant**: El middleware de Clerk inyecta automáticamente el `orgId`. Las actions usan `tenantAction` para asegurar que nadie acceda a datos de otra organización.
2. **Audit Log Service**: Cada cambio (creación/edición) en productos o categorías se registra automáticamente en la tabla `audit_logs`.
3. **Products CRUD**: Tabla interactiva con búsqueda. Soporte para creación y edición via modal `ProductFormDialog.tsx`.
4. **Categories CRUD**: Implementación completa de tabla y formulario con selección de color hexadecimal.
5. **Movements History**: Vista de solo lectura que detalla todos los cambios históricos en el stock, uniendo datos de productos para mostrar nombres.
6. **Settings & Permissions**: Sistema de flags en base de datos para habilitar/deshabilitar módulos (ej. "Library Mode", "Movements").
7. **Sincronización de Esquema**: Se configuró `drizzle.config.ts` y se sincronizaron los esquemas con Neon.

### ⚠️ Notas de Implementación (Importante para IA)
- **TanStack Form + Zod**: Debido a un conflicto de dependencias con `@tanstack/zod-form-adapter` (ERESOLVE), se decidió **no usar el adapter**. La validación se hace de forma nativa en el hook `onChange` del formulario usando `productSchema.safeParse(value)`.
- **Drizzle Public Schema**: No se usa `pgSchema('public')` explícitamente en los archivos de esquema porque Drizzle lo interpreta como el default. Se usa `pgTable` directamente para evitar errores de migración.

## 4. Tareas Pendientes (Roadmap Sugerido)

1. **Flujo de Ajuste de Stock**:
   - Actualmente existe el historial de movimientos, pero falta el modal/acción para "Ajustar Stock" (Stock In/Out) desde la tabla de productos.
   - Archivo destino: `src/features/products/components/StockAdjustmentDialog.tsx`.
2. **Dashboard de Analíticas**:
   - La página `/` (Home) está vacía. Debe mostrar KPIs (Valor total del inventario, productos bajos en stock, movimientos recientes).
3. **Búsqueda Avanzada y Filtros**:
   - Integrar filtros por categoría en la tabla de productos usando `nuqs`.
4. **Pruebas de Calidad**:
   - Implementar tests E2E con Playwright o TestSprite para los flujos de creación crítica.
5. **SEO y Metadatos**:
   - Configurar dinámicamente los títulos de las páginas en los archivos `layout.tsx` y `page.tsx`.

## 5. Documentación Complementaria
- Ver `docs/deuda_tecnica.md` para detalles de por qué se tomaron ciertas decisiones de código contra el stack original.
- Ver `package.json` para verificar versiones exactas de dependencias antes de instalar paquetes nuevos.

---
*Este documento fue generado tras la migración exitosa de los módulos base el 16 de abril de 2026.*
