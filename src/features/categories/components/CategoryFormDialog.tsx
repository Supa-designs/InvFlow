'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { createCategoryAction } from '../actions/categories.actions';
import { toast } from 'sonner';
import { categorySchema } from '../schemas/category.schema';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORY_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#0f172a',
];

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryFormDialog({ open, onOpenChange }: CategoryFormDialogProps) {
  const router = useRouter();
  const { executeAsync: executeCreate, isExecuting } = useAction(createCategoryAction, {
    onSuccess: () => {
      toast.success('Categoría creada exitosamente');
      onOpenChange(false);
      router.refresh();
    },
    onError: (e) => {
      toast.error('Error al crear: ' + e?.error?.serverError);
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      color: '',
    },
    validators: {
      onChange: ({ value }) => {
        const res = categorySchema.safeParse(value);
        if (!res.success) {
          return (res.error as any).issues.map((e: any) => e.message).join(', ');
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await executeCreate(value as any);
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: '', color: '' });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>Crea una categoría para organizar tus productos.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 py-2"
        >
          <form.Field
            name="name"
            children={(field: any) => (
              <div className="space-y-1">
                <Label htmlFor={field.name}>
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ej. Electrónicos"
                />
                {field.state.meta.errors ? (
                  <p className="text-sm border-destructive text-destructive">{field.state.meta.errors.join(', ')}</p>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="color"
            children={(field: any) => (
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-3">
                  {CATEGORY_COLORS.map((color) => {
                    const isSelected = field.state.value === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        className={`h-10 w-10 rounded-full border-2 transition ${isSelected ? 'scale-105 border-foreground ring-2 ring-ring/30' : 'border-border'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.handleChange(color)}
                      />
                    )
                  })}
                </div>
                {field.state.meta.errors ? (
                  <p className="text-sm border-destructive text-destructive">{field.state.meta.errors.join(', ')}</p>
                ) : null}
              </div>
            )}
          />

          <form.Subscribe
            selector={(state: any) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]: any) => (
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isExecuting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!canSubmit || isExecuting}>
                  {isExecuting ? 'Guardando...' : 'Crear'}
                </Button>
              </div>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
