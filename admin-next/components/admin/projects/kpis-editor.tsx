'use client';

import { useFieldArray, type Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectFormValues } from '@/lib/validation/project';

interface Props {
  control: Control<ProjectFormValues>;
}

/**
 * Dynamic editor for the `kpis` array.
 *
 * Why useFieldArray (vs manual array state):
 * - RHF's useFieldArray keeps each row's `register()` stable across renders,
 *   so adding/removing rows doesn't blow up validation / focus / dirty state.
 * - It auto-generates stable keys via `field.id` (don't use the array index).
 *
 * Limit of 8 enforced server-side too (Zod schema). Client-side we just hide
 * the "Add" button when full so the UX stays calm.
 */
export function KpisEditor({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'kpis',
  });

  const max = 8;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">KPIs &amp; metrics</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Up to {max} numbers that prove the project worked. Shown in the
            case-study Results section.
          </p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {fields.length} / {max}
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No KPIs yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {fields.map((field, idx) => (
            <li
              key={field.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-md border border-border bg-card p-2"
            >
              <Input
                placeholder="Label · e.g. Conversion Rate"
                {...control.register(`kpis.${idx}.label` as const)}
                className="h-9"
                aria-label={`KPI ${idx + 1} label`}
              />
              <Input
                placeholder="Value · e.g. +340%"
                {...control.register(`kpis.${idx}.value` as const)}
                className="h-9"
                aria-label={`KPI ${idx + 1} value`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(idx)}
                aria-label={`Remove KPI ${idx + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ label: '', value: '' })}
        disabled={fields.length >= max}
      >
        <Plus className="size-4" />
        Add KPI
      </Button>
    </div>
  );
}
