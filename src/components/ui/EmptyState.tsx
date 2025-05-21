
import type { ReactNode } from 'react';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    href: string;
  }
}

export default function EmptyState({ icon, title, description, actionButton }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border-2 border-dashed rounded-lg bg-card">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actionButton && (
        <Button>
          <Link href={actionButton.href}>{actionButton.text}</Link>
        </Button>
      )}
    </div>
  );
}
