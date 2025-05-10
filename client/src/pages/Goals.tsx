import React from 'react';
import { motion } from 'framer-motion';
import { GoalList } from '@/components/goals/GoalList';

export function Goals() {
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-6">
      {/* Header with gradient text matching Dashboard */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
          Trading Goals
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Set up and track progress of your trading goals
        </p>
      </div>
      
      {/* Main content with motion effects */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-hidden"
      >
        <GoalList />
      </motion.div>
    </div>
  );
}

export default Goals;