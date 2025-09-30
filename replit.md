# Clinic Calling System

## Overview

This is a comprehensive clinic patient calling system designed for healthcare facilities. The application enables efficient patient queue management with real-time TV displays, multi-user administration, and streamlined workflows for medical staff. Built with React, TypeScript, and modern web technologies, it supports both named and numbered patient registration, window/room management, and administrative controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### September 30, 2025 - TV Display Responsive Text Sizing (Updated)
- Removed all JavaScript-based dynamic font sizing to eliminate browser compatibility issues
- Implemented pure CSS responsive tokens (--tv-fs-xs through --tv-fs-5xl) for all text elements
- Updated calling panel, history sections, date/time display, weather info, prayer times, and marquee text
- Removed fontSize override from getTextGroupStyles to ensure CSS tokens always control sizing
- All text now auto-resizes based on screen dimensions using CSS clamp() with vmin units
- Reduced minimum font sizes significantly (e.g., --tv-fs-5xl: 24px min instead of 48px) for better small screen support
- Reduced spacing minimums for tighter layouts on smaller displays
- Supports screen resolutions from 600px to 4K with consistent scaling

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system following Material Design principles
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting light/dark modes with CSS variables

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **API Design**: RESTful endpoints with `/api` prefix
- **Storage Layer**: Abstracted storage interface with both memory and database implementations
- **Session Management**: Express session handling with PostgreSQL session store

### Database Schema
The system uses four main entities:
- **Users**: Authentication and role-based access (admin/user roles)
- **Windows**: Treatment rooms/stations with active status tracking
- **Patients**: Queue management with status tracking (waiting, called, in-progress, completed, requeue)
- **Settings**: Configurable system parameters for display, sound, and general settings

### Component Architecture
- **Layout**: Sidebar-based navigation with responsive design
- **Patient Management**: Card-based interfaces for registration, queue viewing, and calling
- **TV Display**: Full-screen component optimized for large displays with real-time updates
- **Administration**: Role-based user management and system configuration

### Key Features
- **Dual Registration Types**: Support for both named patients and anonymous number-based registration
- **Real-time Queue Management**: Live updates for patient status and queue position
- **Multi-window Support**: Flexible room/station configuration with individual patient assignments
- **TV Display Mode**: Large-format display for patient calling with Islamic prayer times integration
  - **Responsive Text Sizing**: Pure CSS-based responsive tokens (--tv-fs-xs to --tv-fs-5xl) using clamp() with vmin units
  - **Auto-scaling**: All text including numbers automatically resize based on screen dimensions (720p to 4K support)
  - **Browser Compatibility**: Chrome 88+, Edge 88+, Firefox 75+ for optimal CSS clamp() and CSS variables support
- **Audio Integration**: Configurable sound alerts and text-to-speech capabilities
- **Theme Customization**: Medical blue color scheme with accessibility considerations

### Security & Access Control
- **Role-based Authentication**: Admin and user roles with different permission levels
- **Session Management**: Secure session handling with database persistence
- **Password Hashing**: BCrypt for secure password storage

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **bcryptjs**: Password hashing and authentication

### UI & Design
- **@radix-ui/react-***: Accessible UI primitives for components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Modern icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation utilities

### Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express
- **express-session**: Session middleware for user authentication

### Forms & Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation (via Drizzle)

The application is designed to be deployed on platforms supporting Node.js with PostgreSQL database connectivity, with specific optimizations for Replit deployment including development tooling and error overlays.