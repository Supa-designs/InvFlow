'use client';

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ALL_FEATURES, FeatureKey } from "@/hooks/useTenantFeatures";

interface FeatureTogglesProps {
  features: Record<FeatureKey, boolean>;
  onChange: (features: Record<FeatureKey, boolean>) => void;
  disabled?: boolean;
  lockedFeatures?: FeatureKey[];
}

export function FeatureToggles({ features, onChange, disabled, lockedFeatures = [] }: FeatureTogglesProps) {
  const toggle = (key: FeatureKey) => {
    onChange({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-4">
      {ALL_FEATURES.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">{f.label}</Label>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
          <Switch
            checked={features[f.key]}
            onCheckedChange={() => toggle(f.key)}
            disabled={disabled || lockedFeatures.includes(f.key)}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      ))}
    </div>
  );
}
