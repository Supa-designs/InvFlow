'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FeatureToggles } from "@/components/shared/FeatureToggles";
import { BusinessType, FeatureKey, getDefaultFeatures, useTenantFeatures } from "@/hooks/useTenantFeatures";
import { createTenantOnboarding } from "@/features/onboarding/actions/onboarding.actions";
import { ImportPanel } from "@/features/import/components/import-panel";
import { toast } from "sonner";
import { CheckCircle2, FlaskConical, Settings2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<BusinessType>("generic");
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(getDefaultFeatures("generic"));
  const [loading, setLoading] = useState(false);
  
  const { organization, isLoaded } = useOrganization();
  const { updateFeaturesLocal } = useTenantFeatures();
  const router = useRouter();

  const handleBusinessTypeChange = (val: BusinessType | null) => {
    if (!val) return;
    setBusinessType(val);
    setFeatures(getDefaultFeatures(val));
  };

  const handleCreate = async () => {
    if (!organization?.name) {
      toast.error("No se pudo obtener el nombre de la organización.");
      return;
    }

    setLoading(true);
    const result = await createTenantOnboarding({
      businessType,
      featuresConfig: features,
      name: organization.name,
    });

    if (result.success) {
      toast.success("¡Configuración completada!");
      updateFeaturesLocal(features);
      setStep(4);
      setLoading(false);
    } else {
      toast.error(result.error || "Error al completar el onboarding");
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  const stepDescriptions = [
    "Personaliza tu experiencia según tu industria",
    "Activa las módulos que necesitas",
    "Confirmación de servicios",
    "Importa tus datos (opcional)"
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
              {step === 1 && <FlaskConical className="w-8 h-8" />}
              {step === 2 && <Settings2 className="w-8 h-8" />}
              {step >= 3 && <CheckCircle2 className="w-8 h-8" />}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Bienvenido a InvFlow</CardTitle>
          <CardDescription className="text-lg mt-2">{stepDescriptions[step - 1]}</CardDescription>
          
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-2 w-16 rounded-full transition-all duration-300 ${
                  s === step ? "bg-blue-600 w-24" : s < step ? "bg-blue-400" : "bg-gray-200 dark:bg-gray-800"
                }`} 
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <Label className="text-base font-semibold">¿Qué tipo de negocio manejas?</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Seleccionaremos las funcionalidades base más adecuadas para ti.
                </p>
                <Select value={businessType} onValueChange={handleBusinessTypeChange}>
                  <SelectTrigger className="h-12 text-md">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Inventario General</SelectItem>
                    <SelectItem value="library">Biblioteca / Gestión de Libros</SelectItem>
                    <SelectItem value="hardware_store">Ferretería / Repuestos</SelectItem>
                    <SelectItem value="warehouse">Almacén de Distribución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-semibold mb-2">Organización detectada:</h4>
                <p className="text-lg font-medium text-blue-600">{organization?.name || "Sin nombre"}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="pb-2">
                <h4 className="text-base font-semibold">Configuración de módulos</h4>
                <p className="text-sm text-muted-foreground">Puedes habilitar o deshabilitar funciones específicas ahora.</p>
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <FeatureToggles
                  features={features}
                  onChange={setFeatures}
                  lockedFeatures={businessType === 'library' ? ['isbn_lookup'] : []}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-8 animate-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">¡Todo listo!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-lg">
                  Hemos configurado tu espacio de trabajo para <strong>{organization?.name}</strong>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Tipo</p>
                  <p className="font-medium capitalize">{businessType.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Módulos</p>
                  <p className="font-medium">{Object.values(features).filter(Boolean).length} activos</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold">Importación opcional</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes importar tus libros ahora o hacerlo después desde Configuración.
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Omitir este paso
                </Button>
              </div>
              <ImportPanel />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-b-xl px-10">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={loading}>
              Anterior
            </Button>
          )}
          
          <div className="ml-auto">
            {step < 3 ? (
              <Button size="lg" onClick={() => setStep(step + 1)} className="px-8 bg-blue-600 hover:bg-blue-700">
                Siguiente
              </Button>
            ) : step === 3 ? (
              <Button size="lg" onClick={handleCreate} disabled={loading} className="px-10 bg-green-600 hover:bg-green-700 shadow-md">
                {loading ? "Iniciando..." : "Continuar"}
              </Button>
            ) : (
              <Button size="lg" onClick={() => router.push("/dashboard")} className="px-10 bg-green-600 hover:bg-green-700 shadow-md">
                Ir al dashboard
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
