# replit.md

## Overview

This is a professional Forex Trading Journal PWA application built with React, TypeScript, and Firebase. The app allows traders to log their trades, analyze performance, track goals, manage strategies, and automatically capture TradingView charts. It features a modern UI with dark/light theme support, achievement system, and comprehensive analytics for trading performance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: Tailwind CSS with shadcn/ui components for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for global state, React Query for server state
- **PWA Features**: Service worker, manifest.json, and offline support
- **Theme System**: Custom context-based theme provider with system/light/dark modes

### Backend Architecture
- **Database**: Firebase Firestore for real-time data storage
- **Authentication**: Firebase Auth for user management
- **File Storage**: Firebase Storage for image assets
- **Server**: Express.js with TypeScript (minimal API layer)
- **Data Structure**: 
  - Users collection with profile and settings
  - Trades collection with entry/exit data and chart images
  - Goals collection with milestones tracking
  - Strategies collection with rules and conditions

### Component Architecture
- **Layout System**: Centralized layout context with responsive sidebar
- **Component Library**: Radix UI primitives with custom styling
- **Loading States**: Global loading store with hierarchical levels
- **Error Handling**: Comprehensive error boundaries and toast notifications
- **Lazy Loading**: Code splitting for non-critical routes

### Data Management
- **Cache Strategy**: React Query for automatic caching and invalidation
- **Real-time Updates**: Firebase real-time listeners with custom update service
- **Offline Support**: Service worker caching with fallback pages
- **Image Handling**: Auto-capture from TradingView API with retry logic

### Trading Features
- **Trade Logging**: Entry/exit prices, stop loss, take profit tracking
- **Chart Integration**: Automatic H4/M15 timeframe capture from TradingView
- **Performance Analytics**: P&L tracking, win rate, profit factor calculations
- **Goal Setting**: SMART goals with milestone tracking
- **Strategy Management**: Custom trading strategies with entry/exit conditions

## External Dependencies

### Core Services
- **Firebase**: Authentication, Firestore database, and file storage
- **TradingView Capture API**: External service for automated chart screenshots
- **Google Fonts**: Inter font family for typography

### Development Tools
- **ESLint**: Code quality with TypeScript and React rules
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **Sharp**: Image processing for PWA icon generation
- **Firebase Tools**: Deployment and hosting management

### UI and Styling
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting

### Build and Deployment
- **Vite**: Fast build tool with HMR support
- **Firebase Hosting**: Static site hosting with SPA routing
- **PWA Support**: Manifest generation and service worker registration
- **TypeScript**: Full type safety across the application

### Trading and Analytics
- **React Query**: Server state management with caching
- **Recharts**: Chart library for analytics visualization
- **Firebase Admin**: Server-side Firebase operations
- **Custom Metrics**: Trade performance calculation engine