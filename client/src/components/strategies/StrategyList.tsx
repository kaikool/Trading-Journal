import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Plus, Loader2, Pencil, Trash2, ChevronRight, ChevronDown, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StrategyConditionInput } from '@/components/settings/StrategyConditionInput';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useUserData } from '@/hooks/use-user-data';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types for strategy
interface StrategyCondition {
  id: string;
  text: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  conditions: StrategyCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export function StrategyList() {
  const { toast } = useToast();
  const { userData, setUserData, loading } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategyId, setDeletingStrategyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // New strategy state
  const [newStrategy, setNewStrategy] = useState<Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    conditions: []
  });
  
  // Reset the form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setNewStrategy({
        name: '',
        description: '',
        conditions: []
      });
      setEditingStrategy(null);
      setIsCreating(false);
      setIsEditing(false);
    }
  }, [isDialogOpen]);
  
  // Function to add a condition to new strategy
  const addCondition = useCallback(() => {
    if (editingStrategy) {
      setEditingStrategy({
        ...editingStrategy,
        conditions: [
          ...editingStrategy.conditions,
          { id: Date.now().toString(), text: '' }
        ]
      });
    } else {
      setNewStrategy({
        ...newStrategy,
        conditions: [
          ...newStrategy.conditions,
          { id: Date.now().toString(), text: '' }
        ]
      });
    }
  }, [newStrategy, editingStrategy]);
  
  // Function to update a condition
  const updateCondition = useCallback((id: string, text: string) => {
    if (editingStrategy) {
      setEditingStrategy({
        ...editingStrategy,
        conditions: editingStrategy.conditions.map(condition => 
          condition.id === id ? { ...condition, text } : condition
        )
      });
    } else {
      setNewStrategy({
        ...newStrategy,
        conditions: newStrategy.conditions.map(condition => 
          condition.id === id ? { ...condition, text } : condition
        )
      });
    }
  }, [newStrategy, editingStrategy]);
  
  // Function to remove a condition
  const removeCondition = useCallback((id: string) => {
    if (editingStrategy) {
      setEditingStrategy({
        ...editingStrategy,
        conditions: editingStrategy.conditions.filter(condition => condition.id !== id)
      });
    } else {
      setNewStrategy({
        ...newStrategy,
        conditions: newStrategy.conditions.filter(condition => condition.id !== id)
      });
    }
  }, [newStrategy, editingStrategy]);
  
  // Function to create a new strategy
  const createStrategy = useCallback(async () => {
    if (!newStrategy.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for your strategy",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out empty conditions
    const validConditions = newStrategy.conditions.filter(c => c.text.trim());
    
    if (validConditions.length === 0) {
      toast({
        title: "Conditions required",
        description: "Please add at least one condition for your strategy",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create a strategy object
      const strategyToSave: Strategy = {
        id: Date.now().toString(),
        name: newStrategy.name,
        description: newStrategy.description,
        conditions: validConditions,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update user data with the new strategy
      const updatedUserData = {
        ...userData,
        strategies: [...(userData?.strategies || []), strategyToSave]
      };
      
      // Save to firebase (handled by useUserData hook)
      await setUserData(updatedUserData);
      
      toast({
        title: "Strategy created",
        description: "Your trading strategy has been created successfully"
      });
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating strategy:", error);
      toast({
        title: "Error",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [newStrategy, userData, setUserData, toast]);
  
  // Function to edit strategy
  const editStrategy = useCallback(async () => {
    if (!editingStrategy) return;
    
    if (!editingStrategy.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for your strategy",
        variant: "destructive"
      });
      return;
    }
    
    // Filter out empty conditions
    const validConditions = editingStrategy.conditions.filter(c => c.text.trim());
    
    if (validConditions.length === 0) {
      toast({
        title: "Conditions required",
        description: "Please add at least one condition for your strategy",
        variant: "destructive"
      });
      return;
    }
    
    setIsEditing(true);
    
    try {
      // Update the strategy with valid conditions and current timestamp
      const updatedStrategy: Strategy = {
        ...editingStrategy,
        conditions: validConditions,
        updatedAt: new Date()
      };
      
      // Update user data with the edited strategy
      const updatedUserData = {
        ...userData,
        strategies: (userData?.strategies || []).map(s => 
          s.id === updatedStrategy.id ? updatedStrategy : s
        )
      };
      
      // Save to firebase (handled by useUserData hook)
      await setUserData(updatedUserData);
      
      toast({
        title: "Strategy updated",
        description: "Your trading strategy has been updated successfully"
      });
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast({
        title: "Error",
        description: "Failed to update strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEditing(false);
    }
  }, [editingStrategy, userData, setUserData, toast]);
  
  // Function to start editing a strategy
  const startEditStrategy = useCallback((strategy: Strategy) => {
    setEditingStrategy(strategy);
    setIsDialogOpen(true);
  }, []);
  
  // Function to confirm delete
  const confirmDeleteStrategy = useCallback((id: string) => {
    setDeletingStrategyId(id);
    setIsDeleteDialogOpen(true);
  }, []);
  
  // Function to delete a strategy
  const deleteStrategy = useCallback(async () => {
    if (!deletingStrategyId) return;
    
    try {
      // Filter out the strategy to delete
      const updatedUserData = {
        ...userData,
        strategies: (userData?.strategies || []).filter(s => s.id !== deletingStrategyId)
      };
      
      // Save to firebase (handled by useUserData hook)
      await setUserData(updatedUserData);
      
      toast({
        title: "Strategy deleted",
        description: "Your trading strategy has been deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast({
        title: "Error",
        description: "Failed to delete strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingStrategyId(null);
    }
  }, [deletingStrategyId, userData, setUserData, toast]);
  
  // Memoized strategy list render
  const renderStrategyList = useMemo(() => {
    const strategies = userData?.strategies || [];
    
    if (strategies.length === 0) {
      return (
        <Alert className="mt-4 bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You haven't created any strategies yet. Get started by creating your first trading strategy.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Accordion type="multiple" className="mt-4 space-y-2">
        {strategies.map((strategy) => (
          <AccordionItem 
            key={strategy.id} 
            value={strategy.id} 
            className="border rounded-md bg-card"
          >
            <div className="flex justify-between items-center">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="font-medium">{strategy.name}</span>
              </AccordionTrigger>
              
              <div className="flex space-x-2 pr-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditStrategy(strategy);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteStrategy(strategy.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
            
            <AccordionContent className="px-4 pb-4">
              {strategy.description && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {strategy.description}
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Strategy Rules:</h4>
                <ul className="space-y-2">
                  {strategy.conditions.map((condition, index) => (
                    <li key={condition.id} className="flex items-start space-x-2">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{condition.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }, [userData?.strategies, startEditStrategy, confirmDeleteStrategy]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Render strategies list using memoized function */}
      {renderStrategyList}
      
      {/* Add New Strategy Button at the bottom */}
      <div className="flex justify-center mt-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] overflow-y-auto max-h-[85vh]" variant="form">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-lg font-semibold">
                {editingStrategy ? 'Edit trading strategy' : 'Create new trading strategy'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingStrategy 
                  ? 'Update your trading strategy with clear rules and conditions'
                  : 'Define a new trading strategy with clear rules and conditions'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Strategy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Breakout Trading"
                  value={editingStrategy?.name || newStrategy.name}
                  onChange={(e) => {
                    if (editingStrategy) {
                      setEditingStrategy({...editingStrategy, name: e.target.value});
                    } else {
                      setNewStrategy({...newStrategy, name: e.target.value});
                    }
                  }}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">Strategy Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe your trading strategy..."
                  value={editingStrategy?.description || newStrategy.description}
                  onChange={(e) => {
                    if (editingStrategy) {
                      setEditingStrategy({...editingStrategy, description: e.target.value});
                    } else {
                      setNewStrategy({...newStrategy, description: e.target.value});
                    }
                  }}
                  className="min-h-24"
                />
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Strategy Rules & Conditions</Label>
                  <Button variant="outline" size="sm" onClick={addCondition} type="button">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Condition
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(editingStrategy?.conditions || newStrategy.conditions).map((condition, index) => (
                    <StrategyConditionInput
                      key={condition.id}
                      index={index}
                      condition={condition}
                      updateCondition={updateCondition}
                      removeCondition={removeCondition}
                    />
                  ))}
                  
                  {(editingStrategy?.conditions.length === 0 && newStrategy.conditions.length === 0) && (
                    <div className="flex items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                      Click "Add Condition" to define rules for your strategy
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              
              <Button 
                onClick={editingStrategy ? editStrategy : createStrategy}
                disabled={isCreating || isEditing}
              >
                {isCreating || isEditing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {editingStrategy ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {editingStrategy ? 'Update Strategy' : 'Create Strategy'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Strategy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this strategy? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteStrategy}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}