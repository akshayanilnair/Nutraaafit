import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4 animate-fade-in">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-cool text-primary-foreground shadow-glow">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
