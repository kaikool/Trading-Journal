import React from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Dashboard Header Component
 * 
 * A consistent header for dashboard pages with title and optional description
 */
export function DashboardHeader({ 
  title, 
  description, 
  children 
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          {children}
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;