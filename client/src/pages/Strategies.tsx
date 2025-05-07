import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BookCopy } from 'lucide-react';
import { StrategyList } from '@/components/strategies/StrategyList';

export default function StrategiesPage() {
  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-6">
      <PageHeader
        title="Trading Strategies"
        icon={<BookCopy className="h-6 w-6" />}
      />
      
      <div className="mt-6">
        <StrategyList />
      </div>
    </div>
  );
}