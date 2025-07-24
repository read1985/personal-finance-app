# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

This is a personal finance application built with Next.js 14 and Supabase, featuring automated transaction categorization and financial insights.

### Key Architecture Components

**Frontend Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS with Shadcn/ui components, and Recharts for visualization.

**Authentication**: Centralized auth system using Supabase Auth with context provider pattern:
- `AuthProvider` manages user session state globally
- `AuthGuard` protects routes and handles authentication flow
- All database operations include user authentication checks

**Database Layer**: Centralized database operations through `src/lib/supabase.ts`:
- Single `db` object exports all CRUD operations
- All functions include authentication validation
- Handles complex queries with joins (e.g., transactions with account data)
- Special confidence value conversion: Rules store integers (0-100), transactions store decimals (0.00-1.00)

**Page Structure**: App router with protected routes for:
- `/` - Dashboard with spending overview and charts
- `/transactions` - Transaction management with card-based layout and categorization
- `/categories` - Category management with color coding
- `/rules` - Pattern-based categorization rules
- `/accounts` - Account overview
- `/analytics` - Financial insights

### Core Data Flow

**Transaction Categorization System**:
1. Transactions imported from Akahu banking API
2. Database triggers automatically apply categorization rules
3. Users can manually categorize via dropdown or create new rules
4. Rules use pattern matching on transaction descriptions with `%pattern%` syntax
5. Confidence scores help prioritize rule application

**Rule Creation Workflow**:
- Quick rule creation from transaction cards using `QuickRuleDialog`
- Auto-extracts merchant names from transaction descriptions
- Creates pattern-wrapped rules (e.g., `%MERCHANT_NAME%`)
- Immediately applies rule to current transaction

### Important Technical Notes

**Database Confidence Values**: Critical conversion between rules table (integer 0-100) and transactions table (decimal 0.00-1.00). All rule creation functions must convert: `confidence_decimal = confidence_integer / 100.0`

**Color System**: Uses predefined Tailwind color classes for categories. Updated to use calm palette: slate, emerald, teal, sky, violet, rose, amber, lime, indigo, pink.

**UI Patterns**: 
- Card-based layouts with consistent slate color palette
- Form inputs use `border-slate-300` with `focus:border-blue-400 focus:ring-2 focus:ring-blue-100`
- Responsive grid layouts (2-column on large screens)
- Hover states with `hover:shadow-md` and smooth transitions

### Environment Setup

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Recent Fixes Applied

See `FIXES.md` for database trigger fixes related to confidence value conversion that resolved numeric overflow errors in rule creation.