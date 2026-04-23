import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Usaremos un singleton de Neon para aprovechar connection pooling
const sql = neon(process.env.DATABASE_URL || '');

// Schema público - Utilizado para consultar los datos de nivel root
export const db = drizzle(sql);

/**
 * Mantiene compatibilidad con el código existente. En el modelo definitivo
 * usamos tablas compartidas con `tenant_id`, por lo que la instancia es única.
 */
export function getTenantDb(_tenantId: string) {
  return drizzle(sql);
}
