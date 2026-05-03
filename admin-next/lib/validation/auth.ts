import { z } from 'zod';

/**
 * Auth Zod schemas (Zod 4).
 *
 * Note Zod 4 prefers `z.email()` and `z.string().email()` is deprecated.
 * Run-time error messages are tuned for end users — no developer jargon.
 */

export const loginSchema = z.object({
  email: z.email({ message: 'Enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(2, { message: 'Tell us your name (2+ characters)' })
      .max(80, { message: 'Name is a bit long — keep it under 80 characters' }),
    email: z.email({ message: 'Enter a valid email address' }),
    password: z
      .string()
      .min(8, { message: 'Use at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Add at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Add at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Add at least one number' }),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type SignupValues = z.infer<typeof signupSchema>;

/**
 * Lightweight password-strength scorer used by the visual indicator.
 * Returns 0..4. Pure function; called both client-side and (later)
 * server-side without modification.
 */
export function scorePassword(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

export const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;
