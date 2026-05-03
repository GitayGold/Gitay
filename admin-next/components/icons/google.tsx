import type { SVGProps } from 'react';

/**
 * Google "G" mark — official multicolor logo.
 * Uses the brand fills (do not recolor; that violates Google's brand guidelines).
 */
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M12 5.04c1.7 0 3.22.59 4.42 1.74l3.31-3.31C17.78 1.6 15.11.5 12 .5 7.39.5 3.4 3.14 1.45 7.0l3.86 3.0C6.21 7.16 8.86 5.04 12 5.04Z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.68-.22-2.48H12v4.7h6.46c-.28 1.5-1.13 2.78-2.41 3.62l3.74 2.9c2.18-2.02 3.71-5.02 3.71-8.74Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.0a7.0 7.0 0 0 1 0-4.0L1.45 7.0a11.5 11.5 0 0 0 0 10.0l3.86-3.0Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.74-2.9c-1.03.69-2.36 1.1-3.88 1.1-3.14 0-5.79-2.12-6.74-4.96l-3.86 3.0C3.4 20.86 7.39 23.5 12 23.5Z"
      />
    </svg>
  );
}
