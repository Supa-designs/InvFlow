"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { updateTenantSettingsAction } from "../actions/settings.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ALL_FEATURES, getDefaultFeatures, type BusinessType, type FeatureKey } from "@/hooks/useTenantFeatures";
import { useTenantFeatures } from "@/hooks/useTenantFeatures";
import { ImportPanel } from "@/features/import/components/import-panel";
import { ScannerSettingsModal } from "@/features/inventory/components/scanner-settings-modal";
import { resolveEffectiveBusinessType } from "@/lib/tenants/business-type";

export function SettingsForm({ tenant, organizationName }: { tenant: any; organizationName: string }) {
  const router = useRouter();
  const { updateFeaturesLocal } = useTenantFeatures();
  const [name, setName] = useState(organizationName);
  const [businessType] = useState<BusinessType>(
    resolveEffectiveBusinessType(tenant.businessType, tenant.featuresConfig),
  );
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(tenant.featuresConfig || getDefaultFeatures('generic'));
  const [scannerOpen, setScannerOpen] = useState(false);

  const { execute, status } = useAction(updateTenantSettingsAction, {
    onSuccess: () => {
      const nextFeatures = normalizedFeatures;
      updateFeaturesLocal(nextFeatures);
      if (typeof window !== "undefined" && tenant.clerkOrganizationId) {
        window.sessionStorage.setItem(
          `invflow:tenant-features:${tenant.clerkOrganizationId}`,
          JSON.stringify({ businessType, features: nextFeatures }),
        );
      }
      toast.success("Configuración guardada correctamente");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error("Error al guardar: " + (error.serverError || "No autorizado"));
    },
  });

  const isLibrary = businessType === "library";
  const normalizedFeatures = useMemo(() => {
    if (!isLibrary) return features;
    return { ...features, isbn_lookup: true };
  }, [features, isLibrary]);

  const handleSave = () => {
    execute({
      organizationName: name,
      businessType,
      featuresConfig: normalizedFeatures,
    });
  };

  const toggleFeature = (key: FeatureKey, value: boolean) => {
    setFeatures((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl mt-6">
      <div className="rounded-2xl border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Organización</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cambia el nombre visible de tu organización en Clerk y en InvFlow.
          </p>
        </div>

        <div className="max-w-sm space-y-4">
          <Label htmlFor="organization-name">Nombre de organización</Label>
          <Input
            id="organization-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mi organización"
          />
          <p className="text-xs text-muted-foreground">
            Tipo de negocio actual: <span className="font-medium capitalize">{businessType.replace("_", " ")}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-lg font-medium">Feature toggles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ajusta los módulos activos sin salir del patrón heredado de `lovableinv`.
          </p>
        </div>

        <div className="space-y-4">
          {ALL_FEATURES.filter((feature) => !(isLibrary && feature.key === "isbn_lookup")).map((feature) => {
            const locked = isLibrary && feature.key === "isbn_lookup";
            return (
              <div key={feature.key} className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">{feature.label}</Label>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Switch
                  checked={locked ? true : normalizedFeatures[feature.key]}
                  disabled={locked || status === "executing"}
                  onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Scanner</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura y prueba el scanner de códigos desde aquí.
          </p>
        </div>
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            Configurar scanner
          </Button>
        </div>
      </div>

      <ImportPanel />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={status === "executing"}>
          {status === "executing" ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>

      <ScannerSettingsModal open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  );
}
