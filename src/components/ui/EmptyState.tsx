/**
 * Empty State Component
 *
 * Display when lists/data are empty with optional action.
 */

import { ReactNode } from 'react';
import { Button } from './Button';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-6 max-w-md text-gray-600">{description}</p>}

      {actionLabel &&
        (actionHref ? (
          <Link href={actionHref}>
            <Button variant="primary">{actionLabel}</Button>
          </Link>
        ) : (
          onAction && (
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          )
        ))}
    </div>
  );
}
