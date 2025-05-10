import React from 'react';
import { motion } from 'framer-motion';
import { GoalList } from '@/components/goals/GoalList';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function Goals() {
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col"
      >
        {/* Header with gradient title styling matching Dashboard */}
        <div className="flex flex-col mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Trading Goals
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Set up and track progress of your trading goals
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <GoalList openCreateDialogState={[openCreateDialog, setOpenCreateDialog]} />
        </div>
      </motion.div>
    </PageContainer>
  );
}

export default Goals;