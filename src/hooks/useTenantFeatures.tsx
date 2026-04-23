'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { resolveEffectiveBusinessType } from '@/lib/tenants/business-type';

export type FeatureKey =
  | 'isbn_lookup'
  | 'serial_tracking'
  | 'loan_mode'
  | 'unit_of_measure'
  | 'categories'
  | 'movements'
  | 'pricing'
  | 'min_stock';

export type BusinessType = 'library' | 'hardware_store' | 'warehouse' | 'generic';

export const ALL_FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  { key: 'isbn_lookup', label: 'Búsqueda por ISBN', description: 'Permite buscar libros por su código ISBN' },
  { key: 'serial_tracking', label: 'Seguimiento por Serial', description: 'Control de números de serie individuales' },
  { key: 'loan_mode', label: 'Modo Préstamo', description: 'Habilita la funcionalidad de préstamos y devoluciones' },
  { key: 'unit_of_measure', label: 'Unidades de Medida', description: 'Gestión de múltiples unidades (kg, lb, etc)' },
  { key: 'categories', label: 'Categorías', description: 'Organiza productos por categorías' },
  { key: 'movements', label: 'Movimientos', description: 'Historial detallado de entradas y salidas' },
  { key: 'pricing', label: 'Precios y Valoración', description: 'Control de precios de compra y venta' },
  { key: 'min_stock', label: 'Alertas de Stock Mínimo', description: 'Notificaciones cuando el stock es bajo' },
];

export const getDefaultFeatures = (type: BusinessType): Record<FeatureKey, boolean> => {
  const base = {
    isbn_lookup: false,
    serial_tracking: false,
    loan_mode: false,
    unit_of_measure: false,
    categories: true,
    movements: true,
    pricing: true,
    min_stock: true,
  };

  switch (type) {
    case 'library':
      return { ...base, isbn_lookup: true, loan_mode: true };
    case 'hardware_store':
      return { ...base, unit_of_measure: true, serial_tracking: true };
    case 'warehouse':
      return { ...base, serial_tracking: true };
    default:
      return base;
  }
};

type FeaturesContextType = {
  features: Record<FeatureKey, boolean>;
  businessType: BusinessType;
  loading: boolean;
  is: (key: FeatureKey) => boolean;
  updateFeaturesLocal: (newFeatures: Record<FeatureKey, boolean>) => void;
  needsOnboarding: boolean;
};

const defaultFeatures: Record<FeatureKey, boolean> = {
  isbn_lookup: false,
  serial_tracking: false,
  loan_mode: false,
  unit_of_measure: false,
  categories: false,
  movements: false,
  pricing: false,
  min_stock: false,
};

const FeaturesContext = createContext<FeaturesContextType>({
  features: defaultFeatures,
  businessType: 'generic',
  loading: true,
  is: () => false,
  updateFeaturesLocal: () => {},
  needsOnboarding: false,
});

export function TenantFeaturesProvider({ children }: { children: React.ReactNode }) {
  const { orgId, isLoaded } = useAuth();
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(defaultFeatures);
  const [businessType, setBusinessType] = useState<BusinessType>('generic');
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!orgId) {
      setFeatures(defaultFeatures);
      setBusinessType('generic');
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    const storageKey = `invflow:tenant-features:${orgId}`;
    const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as {
          businessType: BusinessType;
          features: Record<FeatureKey, boolean>;
        };
        setBusinessType(parsed.businessType);
        setFeatures(parsed.features);
      } catch {}
    }

    setLoading(true);
    fetch(`/api/tenant/${orgId}/features`, { cache: 'no-store' })
      .then((res) => {
        if (res.status === 404) {
          setNeedsOnboarding(true);
          throw new Error('Tenant config missing');
        }
        if (!res.ok) throw new Error('No tenant info');
        return res.json();
      })
      .then((data) => {
        const nextBusinessType = resolveEffectiveBusinessType(data.businessType, data.featuresConfig);
        const nextFeatures = {
          ...getDefaultFeatures(nextBusinessType),
          ...(data.featuresConfig ?? defaultFeatures),
        };

        if (nextBusinessType === 'library') {
          nextFeatures.isbn_lookup = true;
        }

        setBusinessType(nextBusinessType);
        setFeatures(nextFeatures);
        setNeedsOnboarding(false);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({ businessType: nextBusinessType, features: nextFeatures }),
          );
        }
      })
      .catch((err) => {
        console.warn('Failed settling tenant data', err);
        setNeedsOnboarding(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orgId, isLoaded]);

  const is = (key: FeatureKey) => !!features[key];
  
  const updateFeaturesLocal = (newFeatures: Record<FeatureKey, boolean>) => {
    setFeatures(newFeatures);
  };

  return (
    <FeaturesContext.Provider value={{ features, businessType, loading, is, updateFeaturesLocal, needsOnboarding }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useTenantFeatures() {
  return useContext(FeaturesContext);
}
