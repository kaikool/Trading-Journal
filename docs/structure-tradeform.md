# TradeFormNew Component Structure

This document describes the new modular structure of the TradeFormNew component after refactoring it into smaller, maintainable pieces.

## Directory Structure

```
client/src/components/trades/
├── TradeFormNew/                     # Main directory for the refactored component
│   ├── components/                   # UI components
│   │   ├── FormHeader.tsx            # Header component with draft notices
│   │   ├── TradeDetails.tsx          # Trade details section (pair, direction, etc.)
│   │   ├── TradeStrategy.tsx         # Strategy-related fields and checklist
│   │   ├── TradePsychology.tsx       # Psychology and discipline switches
│   │   ├── TradeImages.tsx           # Image upload section (entry/exit)
│   │   ├── ImageUpload.tsx           # Reusable image upload component
│   │   ├── NotesSection.tsx          # Notes input section
│   │   ├── FormActions.tsx           # Form action buttons (submit, cancel, etc.)
│   │   └── index.ts                  # Export all components
│   ├── hooks/                        # Custom hooks for form logic
│   │   ├── useDraftManagement.ts     # Draft saving/loading functionality
│   │   ├── useImageManagement.ts     # Image upload/management functionality
│   │   ├── useStrategyManagement.ts  # Strategy loading and checklist functionality
│   │   ├── useTradeCalculations.ts   # Trade calculation functionality
│   │   ├── useTradeForm.ts           # Main form hook that combines all others
│   │   └── index.ts                  # Export all hooks
│   ├── types.ts                      # Shared types and interfaces
│   └── index.tsx                     # Main component entry point
└── LazyTradeEditForm.tsx             # Lazy loading wrapper (not modified)
```

## Component Responsibilities

### Main Components

1. **TradeFormNew/index.tsx**:
   - Main container component
   - Integrates all sub-components and hooks
   - Maintains form context and state

### UI Components

1. **FormHeader.tsx**:
   - Displays draft notices
   - Provides draft management actions

2. **TradeDetails.tsx**:
   - Currency pair selection
   - Direction selection
   - Entry/exit price inputs
   - Date selection
   - Real-time price fetching

3. **TradeStrategy.tsx**:
   - Strategy selection
   - Technical pattern input
   - Strategy checklist
   - Market condition selection

4. **TradePsychology.tsx**:
   - Discipline and psychology toggles
   - Emotional state selection

5. **TradeImages.tsx**:
   - Manages entry and exit images
   - Container for ImageUpload components

6. **ImageUpload.tsx**:
   - Reusable image upload component
   - Preview and remove functionality
   - Upload progress indication

7. **NotesSection.tsx**:
   - Notes input field

8. **FormActions.tsx**:
   - Form action buttons
   - Submit, cancel, and draft management

### Custom Hooks

1. **useDraftManagement.ts**:
   - Auto-save drafts
   - Load drafts
   - Clear drafts
   - Inactivity tracking

2. **useImageManagement.ts**:
   - Image upload handling
   - Preview generation
   - Upload progress tracking
   - Error handling

3. **useStrategyManagement.ts**:
   - Load strategies
   - Handle strategy selection
   - Manage checklist items

4. **useTradeCalculations.ts**:
   - Calculate lot size
   - Calculate take profit
   - Calculate risk:reward ratio
   - Calculate profit/loss

5. **useTradeForm.ts**:
   - Integrates all other hooks
   - Form submission logic
   - Form initialization

## Types

The `types.ts` file contains all shared types for the form, including:

- TradeFormValues (form data structure)
- TradeFormProps (component props)
- NewTradeProps and EditTradeProps (specific mode props)
- ImageState (image upload state)
- Various context types

## Benefits of the Refactoring

1. **Improved Code Organization**:
   - Clear separation of concerns
   - Each file has a specific responsibility
   - Logical grouping of related functionality

2. **Enhanced Maintainability**:
   - Smaller, more focused components
   - Isolated logic in custom hooks
   - Easier to find and fix bugs

3. **Better Reusability**:
   - Reusable components like ImageUpload
   - Reusable hooks for common functionality
   - Shared types for consistency

4. **Simplified Testing**:
   - Individual components can be tested in isolation
   - Hooks can be tested independently

5. **Easier Feature Extension**:
   - New features can be added without modifying existing code
   - Clear architecture makes it obvious where to add new functionality

This modular architecture ensures the trade form is maintainable, extensible, and easy to understand for future development.