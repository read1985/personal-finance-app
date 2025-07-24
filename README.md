# Personal Finance App

Modern personal finance app with automated categorization and real-time insights, built with Next.js and Supabase.

## Features

- **Dashboard Overview** - Beautiful visualizations of spending patterns and financial insights
- **Transaction Management** - View, search, and categorize financial transactions
- **Smart Categorization** - Automated transaction categorization using rules and AI
- **Category Management** - Create and manage custom spending categories with colors
- **Rules Engine** - Set up pattern-based rules for automatic transaction categorization
- **Real-time Data** - Live connection to Supabase backend with Akahu banking integration
- **Modern UI** - Clean, responsive design built with Tailwind CSS and Shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui, Lucide React
- **Charts**: Recharts for data visualization
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Banking Data**: Akahu API integration
- **Forms**: React Hook Form with Zod validation

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/read1985/personal-finance-app.git
cd personal-finance-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Schema

The app connects to a Supabase database with the following main tables:

- **accounts** - Bank account information from Akahu
- **transactions** - Financial transactions with categorization
- **categories** - User-defined spending categories
- **rules** - Pattern-based categorization rules
- **ai_categorizations** - AI-generated category suggestions

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Manual Build

```bash
npm run build
npm start
```

## Contributing

This project was generated with Claude Code. Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details.