import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { DashboardService } from '@/features/dashboard/services/dashboard.service';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Copy, CalendarPlus, AlertCircle, AlertTriangle, DollarSign, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardChart } from '@/components/dashboard/dashboard-chart';
import { resolveEffectiveBusinessType } from '@/lib/tenants/business-type';
import type { FeatureKey } from '@/hooks/useTenantFeatures';

export default async function DashboardPage() {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  if (!tenant) return <div>Organización no registrada en Postgres</div>;

  const features = tenant.featuresConfig as Partial<Record<FeatureKey, boolean>>;
  const isLibrary = resolveEffectiveBusinessType(tenant.businessType, features) === 'library';

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const dashboardService = new DashboardService(db, tenant.id);
  const { allProducts, recentAudit, recentMovements } = await dashboardService.getDashboardMetrics(thirtyDaysAgo);

  // Procesar datos para la gráfica
  const chartDataMap = new Map<string, { entries: number; exits: number }>();
  
  // Inicializar mapa con los últimos 30 días (vacíos)
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    chartDataMap.set(dateStr, { entries: 0, exits: 0 });
  }

  recentMovements.forEach((movement) => {
    if (!movement.createdAt) return;
    const dateStr = movement.createdAt.toISOString().split('T')[0];
    if (chartDataMap.has(dateStr)) {
      const current = chartDataMap.get(dateStr)!;
      if (movement.type === 'in') current.entries += movement.quantity;
      if (movement.type === 'out') current.exits += movement.quantity;
    }
  });

  const chartData = Array.from(chartDataMap.entries()).map(([date, data]) => ({
    date,
    entries: data.entries,
    exits: data.exits,
  }));

  const totalTitles = allProducts.length;
  const totalCopies = allProducts.reduce((s, p) => s + (p.stockQuantity ?? 0), 0);
  const addedThisMonth = allProducts.filter((p) => p.createdAt && p.createdAt >= thirtyDaysAgo).length;
  const incomplete = allProducts.filter((p) => !p.metadata || !p.sku).length;
  const lowStock = allProducts.filter((p) => (p.minStock ?? 0) > 0 && p.stockQuantity! <= p.minStock!).length;
  const inventoryValue = allProducts.reduce((s, p) => s + (p.stockQuantity! * (Number(p.salePrice) || 0)), 0);

  // Todo esto es código RSC (Server Rendered)
  if (totalTitles === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-gray-200">
        <Package className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {isLibrary ? 'Empieza escaneando tu primer libro' : 'Empieza agregando tu primer producto'}
        </h2>
        <p className="text-muted-foreground mb-6">
          Agrega productos para ver las métricas de tu inventario
        </p>
        <Link href="/products?create=1">
          <Button>{isLibrary ? 'Agregar libro' : 'Agregar producto'}</Button>
        </Link>
      </div>
    );
  }

  const metricCards = [
    { label: isLibrary ? "Total de títulos" : "Total productos", value: totalTitles.toString(), icon: BookOpen, color: "text-blue-500" },
    { label: isLibrary ? "Total de copias" : "Total stock", value: totalCopies, icon: Copy, color: "text-blue-500" },
    { label: "Agregados este mes", value: addedThisMonth, icon: CalendarPlus, color: "text-green-500" },
    { label: "Registros incompletos", value: incomplete, icon: AlertCircle, color: "text-yellow-500" },
  ];

  if (features.min_stock) {
    metricCards.push({ label: isLibrary ? "Copias bajas" : "Stock bajo", value: lowStock, icon: AlertTriangle, color: "text-red-500" });
  }

  if (features.pricing) {
    metricCards.push({ label: "Valor del inventario", value: `$${inventoryValue.toLocaleString()}`, icon: DollarSign as any, color: "text-blue-500" });
  }

  const recentProducts = [...allProducts].sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime()).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu inventario</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad del inventario ({isLibrary ? 'Títulos' : 'Unidades'})</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isLibrary ? "Títulos recientes" : "Productos recientes"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {recentProducts.map((p) => {
                const metadata = p.metadata as any;
                const author = isLibrary ? (metadata?.author || p.name) : p.name;
                return (
                  <div key={p.id} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-full aspect-[2/3] rounded-md bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground group-hover:bg-accent transition-colors">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-2 leading-tight">{p.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad</p>
            ) : (
              <div className="space-y-3">
                {recentAudit.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium block truncate">{a.entityType}: {a.action}</span>
                      <span className="text-muted-foreground text-xs">{a.clerkUserId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {a.createdAt?.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
