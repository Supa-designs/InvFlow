import type { BusinessType, FeatureKey } from "@/hooks/useTenantFeatures";

export function resolveEffectiveBusinessType(
  businessType: string | null | undefined,
  featuresConfig?: Partial<Record<FeatureKey, boolean>> | null,
): BusinessType {
  if (businessType === "library" || businessType === "hardware_store" || businessType === "warehouse") {
    return businessType;
  }

  if (featuresConfig?.isbn_lookup && featuresConfig?.loan_mode) {
    return "library";
  }

  return "generic";
}
