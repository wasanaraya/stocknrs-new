# Overview

This is a comprehensive stock management system built as a standalone React application. The system provides functionality for managing inventory, tracking stock movements, handling suppliers and categories, scanning barcodes, and processing budget requests with email-based approvals. It features a modern, responsive React frontend that connects directly to Supabase for backend functionality, utilizing PostgreSQL for data storage and real-time features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom design system featuring gradients and modern aesthetics
- **State Management**: React Context API with useReducer for global stock state management
- **Routing**: React Router for client-side navigation with protected routes
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Data Fetching**: TanStack Query for server state management and caching

## Backend Architecture
- **Service**: Supabase as primary backend service for database operations
- **Client Integration**: Direct browser-to-Supabase communication using Supabase JavaScript client
- **Real-time Features**: Supabase real-time subscriptions for live data updates
- **API Design**: Database operations through Supabase client with type-safe queries
- **Error Handling**: Client-side error handling with proper user feedback
- **Logging**: Browser console logging for development and debugging

## Data Storage Solutions
- **Database**: PostgreSQL hosted on Supabase cloud platform
- **Client Library**: Supabase JavaScript client for database operations
- **Schema Management**: Database schema managed through Supabase dashboard and migrations
- **Connection**: Direct browser connection to Supabase with automatic connection pooling
- **Migration Strategy**: Supabase migrations for database schema version control

## Authentication and Authorization
- **Service**: Supabase Auth for user authentication and session management
- **Security**: Row Level Security (RLS) policies for data access control
- **Session Handling**: JWT-based authentication with automatic token refresh

## External Service Integrations
- **Email Service**: EmailJS for sending budget request notifications and approvals
- **Barcode Scanning**: ZXing library for camera-based barcode reading functionality
- **File Storage**: Supabase Storage for document and image uploads
- **Real-time Updates**: Supabase real-time subscriptions for live data synchronization

## Key Features and Modules
- **Inventory Management**: Complete CRUD operations for products with stock level tracking
- **Stock Movements**: In/out transaction logging with reasons and reference tracking
- **Category Management**: Hierarchical product categorization with medicine classification
- **Supplier Management**: Vendor information and contact management
- **Barcode Scanner**: Camera-based product lookup and identification
- **Budget Requests**: Workflow for expense approvals with email notifications
- **Reporting Dashboard**: Analytics and insights with chart visualization
- **Settings Management**: System configuration and user preferences

## Development and Deployment
- **Build System**: Vite for frontend development and production bundling
- **Development Server**: Vite dev server running on port 8080 with hot module replacement
- **Environment**: Separate development and production configurations via environment variables
- **Package Management**: npm with lockfile for dependency consistency
- **Code Quality**: TypeScript strict mode for type safety and error prevention

# External Dependencies

## Database and Storage
- **Supabase**: PostgreSQL database hosting, authentication, real-time features, and complete backend service
- **Supabase JavaScript Client**: Official client library for database operations and authentication

## UI and Styling
- **Radix UI**: Headless component primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Shadcn/ui**: Pre-built component library with consistent design patterns
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking for JavaScript
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation for form inputs and API responses

## Communication Services
- **EmailJS**: Client-side email sending for notifications and approvals
- **ZXing**: Barcode and QR code scanning library for product identification

## Data Visualization
- **Recharts**: Chart library for dashboard analytics and reporting
- **Date-fns**: Date manipulation and formatting utilities

## State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Context**: Global state management for application-wide data