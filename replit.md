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
- **tickets**: Stores ticket details for any calendar date with SLA tracking and status management

### Core Business Logic
- **Priority System**: Shrishti (1st) → Aakash (2nd) → Ashish (3rd) → Sahil (4th)
- **Flexible Booking**: Team members can book any 2 weekend days per month
- **Conflict Resolution**: Automatic priority-based resolution when multiple people book the same day
- **Real-time Updates**: Immediate UI updates using React Query mutations

### Frontend Components
- **Calendar Component**: Interactive monthly calendar with click-to-book functionality and ticket management
- **Sidebar**: Team member filters and booking status tracking
- **Header**: User authentication display and navigation
- **Dashboard**: Main application view combining all components
- **Ticket Modal**: Comprehensive ticket management interface with form validation and CRUD operations

## Data Flow

1. **User Authentication**: Currently hardcoded to 'Shrishti' (mock implementation)
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
- July 05, 2025. Initial setup with complete weekend duty scheduler
- July 05, 2025. Enhanced UI with interactive features:
  * Fixed query client to properly handle month parameters in API calls
  * Added user switching functionality (click user icon to switch between team members)
  * Improved calendar with larger day cells (h-20), hover effects, and visual feedback
  * Enhanced team member display with booking status and improved avatars
  * Added cancel booking feature (Shift+click on your booked days)
  * Implemented better visual indicators for team member assignments
  * Added helpful usage instructions in calendar footer
  * Made interface more interactive with transitions and hover states
- July 05, 2025. Major UI overhaul for smooth modern design:
  * Redesigned header with gradient background and modern "Team Calendar" branding
  * Implemented smooth calendar with gap-px grid layout and rounded corners
  * Enhanced day cells with better spacing, improved hover animations, and clean typography
  * Added glassmorphism effects to sidebar cards with backdrop-blur
  * Improved team member cards with scale effects and rounded-xl design
  * Enhanced booking status displays with colored backgrounds and better visual hierarchy
  * Updated legend with modern iconography and smooth hover transitions
  * Applied gradient background to main dashboard for depth and visual appeal
- July 05, 2025. Implemented privacy controls and Excel export:
  * Added individual access keys for each team member (SHRISHTI_2025_SECURE, etc.)
  * Created secure authentication system with login page and access key validation
  * Protected all API endpoints with authentication middleware
  * Added beautiful Excel export functionality with multiple sheets (Schedule, Summary, Conflicts)
  * Implemented logout functionality and session management
  * Enhanced header with Export Excel button and logout controls
  * Ensured users can only book/cancel their own appointments for privacy
- July 12, 2025. Added comprehensive ticket management system:
  * Extended database schema with tickets table for storing ticket details
  * Implemented full CRUD API endpoints for ticket management with authentication
  * Created intuitive ticket modal with form validation using React Hook Form and Zod
  * Added support for multiple ticket IDs, priority system (P1-P4), and status tracking
  * Enabled ticket management on any calendar date via Ctrl+click or right-click
  * Enhanced calendar UI with ticket indicators and updated usage instructions
  * Integrated ticket system with existing authentication and user permissions
  * Added visual feedback for priority and status with color-coded badges
- July 12, 2025. Updated ticket system to use YondrOne priority system:
  * Replaced SLA system with YondrOne priority classifications (P1-P4)
  * P1: Critical - System Down (Complete loss of YondrOne, no workaround)
  * P2: High - Critical Feature Loss (Complete loss of critical feature, no workaround)
  * P3: Medium - Non-Critical Feature (Service operational, non-critical feature issue)
  * P4: Low - No Customer Impact (Service operational, no customer impact)
  * Updated database schema from 'sla' to 'priority' column
  * Enhanced ticket modal with detailed priority descriptions and color coding
- July 13, 2025. Successfully migrated from Replit Agent to Replit environment:
  * Fixed auto reload functionality with Enter key press (avoiding form interference)
  * Implemented auto reload on login/logout with proper redirects
  * Resolved ticket creation API call issues and improved error handling
  * Fixed booking functionality JSON parsing errors in API requests
  * Updated apiRequest function to use modern options object pattern
  * Enhanced form validation and debugging capabilities for ticket management
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```