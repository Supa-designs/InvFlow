# InvFlow v1 Migration Notes

## Decisiones principales
- El modelo multitenant definitivo usa **tablas compartidas con `tenant_id`**.
- `Clerk Organizations` es la fuente de verdad para miembros, roles e invitaciones.
- `Neon Branches` se reservan para `preview`, `testing`, `staging` y otros entornos efímeros.
- `library` es el caso principal; `generic` permanece operativo.

## Bootstrap de base de datos
1. Configurar `DATABASE_URL`.
2. Aplicar la migración base en [`drizzle/0001_shared_tenant_model.sql`](/Users/fernan/Dev/turboinv/apps/invflow/drizzle/0001_shared_tenant_model.sql).
3. Crear una organización en Clerk.
4. Completar onboarding para persistir la fila en `tenants`.

## Clerk Organizations
- Invitaciones enviadas desde `/members`.
- Clerk envía correo al destinatario.
- El destinatario puede existir o ser nuevo.
- Si es nuevo, deberá registrarse antes de aceptar la invitación.
- La app usa una UI propia para listar miembros e invitaciones, pero el backend real es Clerk.

## ISBN lookup y cache
- Endpoint: `/api/lookup/isbn`.
- Orden:
  1. Upstash Redis
  2. Open Library
  3. Google Books
- Respuesta normalizada para formularios, scanner e importación.

## Importación
- El módulo vive en `src/features/import`.
- `column-synonyms.ts` es la única fuente de verdad para auto-mapeo.
- La primera versión está optimizada para `library`.

## Iconos animados
- Los iconos animados se instalan vía `shadcn` registry `@lucide-animated`.
- Se encapsulan en wrappers locales dentro de `src/components/ui`.
- Se usan solo en navegación y acciones clave para limitar peso visual y deuda.
