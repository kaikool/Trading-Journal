import React from 'react';
import { motion } from 'framer-motion';
import { GoalList } from '@/components/goals/GoalList';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { PageContainer } from '@/components/layout/PageContainer';

export function Goals() {
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col"
      >
        <DashboardHeader title="Trading Goals" description="Set up and track progress of your trading goals" />
        
        <div className="flex-1 overflow-hidden">
          <GoalList />
        </div>
      </motion.div>
    </PageContainer>
  );
}

export default Goals;