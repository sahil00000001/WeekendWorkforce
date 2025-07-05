# Weekend Duty Scheduler

## Overview

This is a comprehensive Weekend Duty Management System built for a 4-person SaaS team. The application allows team members to book any 2 weekend days per month with a priority-based conflict resolution system. The system features a modern React frontend with TypeScript, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Development**: Hot reload with tsx for development server

## Key Components

### Database Schema
- **team_members**: Stores team member information with priority levels and color coding
- **bookings**: Tracks individual booking requests with conflict flags
- **final_schedule**: Stores the resolved monthly schedule after conflict resolution

### Core Business Logic
- **Priority System**: Srishti (1st) → Aakash (2nd) → Ashish (3rd) → Sahil (4th)
- **Flexible Booking**: Team members can book any 2 weekend days per month
- **Conflict Resolution**: Automatic priority-based resolution when multiple people book the same day
- **Real-time Updates**: Immediate UI updates using React Query mutations

### Frontend Components
- **Calendar Component**: Interactive monthly calendar with click-to-book functionality
- **Sidebar**: Team member filters and booking status tracking
- **Header**: User authentication display and navigation
- **Dashboard**: Main application view combining all components

## Data Flow

1. **User Authentication**: Currently hardcoded to 'Srishti' (mock implementation)
2. **Team Data Loading**: Fetch team members on application start
3. **Monthly Schedule**: Load current month's schedule and bookings
4. **Booking Process**: 
   - User clicks on weekend day in calendar
   - Frontend sends booking request to backend
   - Backend processes conflicts using priority system
   - Response updates UI with new booking status
5. **Conflict Resolution**: Automatic server-side processing based on team member priority

## External Dependencies

### Frontend Dependencies
- **UI Components**: Comprehensive Radix UI component library
- **Styling**: Tailwind CSS with PostCSS for processing
- **State Management**: TanStack Query for server state synchronization
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod for runtime type checking
- **Database Connection**: Neon Database serverless driver
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Neon Database with connection pooling

### Production Build
- **Frontend**: Vite build process outputs to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit for schema migrations
- **Environment**: Production mode with optimized builds

### Build Commands
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run db:push`: Push database schema changes

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```