# Deuda Técnica y Resoluciones Pragmáticas (InvFlow)

Este documento registra los atajos, simplificaciones o rediseños arquitectónicos tomados para balancear las reglas de la "Arquitectura SaaS Inventario (1).md" con la velocidad de ejecución y evitar *overengineering* en esta refactorización.

## Resoluciones durante Migración:

1. **Gestión de Roles**:
   - **Situación:** El documento de arquitectura definía el control de `memberships` en bases de datos PostgreSQL para emular la pertenencia al Tenant.
   - **Solución Adoptada:** Se acordó con el usuario utilizar nativamente **Clerk Organizations** y asignar los metadatos de roles ahí. 
   - **Acción Tomada:** Se eliminó la tabla `memberships` de `schema/public`. Todo validado mediante las herramientas Clerk para simplificar `requireRole()`.

2. **Setup de next-safe-action y multitenant**:
   - **Situación:** En el documento la instanciación de la base de datos tomaba `{ schema: tenant_${tenantId} }` directamente. Drizzle ORM actualmente se ajusta mejor manejando `db.setSchema()` o pasando el esquema particular a query builds en tiempo de ejecución.
   - **Solución Adoptada:** Por ahora, se mantendrá un pool unificado e inicialización mediante `getTenantDb()` inyectada en los server actions.

3. **Dashboards y DAOs Read-Only**:
   - **Situación:** Se pide estrictamente que todo acceso a DB de negocio sea via Repositorios de Service slices.
   - **Solución Adoptada:** Las metricas (estadísticas agregadas de Dashboard) suelen ser *cross-domain*. Por velocidad, y dado que es React Server Components, las consultas son agregadas mediante `db.select` directamente en la pagina.

4. **Filtrado en Tabla de Productos (TanStack + nuqs)**:
   - **Situación:** Migración para tablas robustas.
   - **Solución Adoptada:** Para la primera iteración se esta alimentando el listado en render de Servidor y delegando la paginación/filtrado principal global (con `useQueryState`) al cliente, favoreciendo renderización veloz antes de sobre-escribir endpoints costosos.

5. **Settings y Members (Roles/Invitaciones)**:
   - **Situación:** Se debía reescribir la lógica de invitaciones de Supabase a Clerk manteniendo validaciones de roles y miembros.
   - **Solución Adoptada:** Se embutió `<OrganizationProfile />` provisto por Clerk en la ruta de `/members`. Delega 100% de la responsabilidad de la UI de gestión de miembros, invitaciones por correo y asignación de roles a Clerk, en lugar de mantener un CRUD duplicado localmente. Solo guardamos configuraciones de negocio (`featuresConfig`, `businessType`) relacionadas al ID de la organización.

### 6. Uso de Componentes de Settings y Members
- Se delegó por completo la administración de usuarios del sistema a `<OrganizationProfile />` de Clerk dentro de `/members`.
- Esto evitó reimplementar lógicas de membresías, invitaciones y asignaciones de roles de manera manual ahorrando deuda técnica.

### 7. Conflicto de Dependencias con Adaptador de TanStack (Zod)
- **Desafío:** La dependencia `@tanstack/zod-form-adapter` solicitaba dependencias anidadas con las versiones `>=3.x` de zod que causaban problemas de resolución (ERESOLVE) al intentar convivir con otras herramientas del nuevo empaquetado y Next 15/16.
- **Decisión:** En `CategoryFormDialog.tsx` y `ProductFormDialog.tsx`, se optó por eliminar el uso estricto del adaptador ajeno y reemplazar el validador oficial del campo (`validatorAdapter: zodValidator()`) por una comprobación nativa mediante el método `.safeParse` de zod directamente en el middleware `onChange` de los forms.
- **Ventaja:** Preserva la naturaleza type-safe del formulario evitando que la app deje de compilar reduciendo al mínimo la dependencia en adapters de terceros.

### 8. Esquema "public" vs default schema
- En Drizzle `pgObject` fallaba al intentar definir un esquema llamado "public" (`pgSchema('public')`) ya que Drizzle restringe usar el default del dialecto en Postgresql.
- Se optimizaron las declaraciones simplemente usando `pgTable('...', { ... })`.

*(Documento en evolución durante la migración)*
