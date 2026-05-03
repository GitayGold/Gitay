'use client';

import { scorePassword, STRENGTH_LABELS } from '@/lib/validation/auth';
import { cn } from '@/lib/utils';

const COLORS: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-emerald-500',
};

interface Props {
  password: string;
}

/**
 * 4-segment strength meter. Re-renders cheaply on each keystroke; the
 * scoring logic lives in lib/validation/auth.ts so it stays a single
 * source of truth (and is reusable server-side).
 */
export function PasswordStrength({ password }: Props) {
  const score = scorePassword(password);
  const label = STRENGTH_LABELS[score];

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex h-1 flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={cn(
              'h-full flex-1 rounded-full transition-colors duration-300',
              segment <= score ? COLORS[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'min-w-[48px] text-right font-medium tabular-nums',
          score === 0 && 'text-muted-foreground',
          score === 1 && 'text-red-500',
          score === 2 && 'text-orange-500',
          score === 3 && 'text-yellow-600',
          score === 4 && 'text-emerald-600',
        )}
      >
        {label || '—'}
      </span>
    </div>
  );
}
