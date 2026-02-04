# Kontestis Frontend v2

A modern React frontend for the Kontestis competitive programming platform, built with TypeScript, Vite, and shadcn/ui.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautifully designed components built with Radix UI
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **React Router v6** - Client-side routing
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# From the workspace root
pnpm install

# Or from this directory
pnpm install
```

### Development

```bash
pnpm dev
```

The development server will start at `http://localhost:5174`.

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── api/                 # API hooks (TanStack Query)
│   ├── http.ts          # Axios instance and helpers
│   ├── auth.ts          # Authentication hooks
│   ├── contests.ts      # Contest hooks
│   ├── problems.ts      # Problem hooks
│   ├── submissions.ts   # Submission hooks
│   ├── organisations.ts # Organisation hooks
│   └── contest-extras.ts # Announcements, questions
├── components/
│   ├── layout/          # Layout components (Navbar, Sidebar)
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Page components
│   ├── auth/            # Login, Register
│   ├── organisation/    # Organisation selection
│   ├── dashboard/       # Dashboard
│   ├── contests/        # Contests list and view
│   ├── problems/        # Problems list and view
│   ├── submissions/     # Submission view
│   └── account/         # User account settings
├── routes/              # Route definitions
├── store/               # Zustand stores
├── styles/              # Global styles
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## Features

### Authentication
- Email/password login
- Google OAuth
- AAI@EduHr authentication

### Contests
- Browse all contests
- Filter by status (upcoming, running, finished)
- Join contests
- View contest problems
- Ask clarification questions
- View announcements

### Problems
- Browse problems
- Filter by solve status
- View problem descriptions
- Submit solutions
- View submission history

### Submissions
- View detailed submission results
- Test cluster breakdown
- Source code display
- Copy code to clipboard

### Account
- Profile management
- Theme selection (light/dark/system)
- Session management

## Environment Variables

Create a `.env` file in this directory:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Adding New shadcn/ui Components

This project uses shadcn/ui for UI components. To add new components:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add sheet
npx shadcn@latest add alert
```

## License

Private - Kontestis
