# Rodab Medical Hospital

International Hospital providing quality healthcare, emergency ambulance dispatch, and first-class medical attention.

## Tech Stack

- **Client**: React 18 + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Deployment**: Vercel (client) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase CLI
- Vercel CLI (optional)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

2. Set up environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your Supabase credentials
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Deployment

#### 1. Deploy Edge Functions to Supabase

```bash
supabase login
supabase link --project-ref cemaqackwtqkkqxlkttn
supabase functions deploy
```

#### 2. Set Edge Function Secrets

```bash
supabase secrets set SUPABASE_URL=https://cemaqackwtqkkqxlkttn.supabase.co
supabase secrets set SUPABASE_SERVICE_KEY=your_service_role_key
```

#### 3. Deploy Client to Vercel

```bash
vercel --prod
```

## Project Structure

```
rodabmed-recovery/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── api.js          # API client
│   │   └── config.js       # Configuration
│   └── public/             # Static assets
├── server/                 # Express server (legacy)
├── supabase/
│   └── functions/          # Edge Functions
│       ├── _shared/        # Shared utilities
│       ├── auth-login/     # Authentication
│       ├── doctors/        # Doctor management
│       └── ...             # Other functions
└── vercel.json             # Vercel configuration
```

## Features

- **Patient Dashboard**: Appointments, consultations, prescriptions
- **Doctor Dashboard**: Patient management, availability, consultations
- **Admin Dashboard**: Analytics, user management, emergency dispatch
- **Super Admin Dashboard**: System-wide management, logs
- **Driver Dashboard**: Ride management, location tracking
- **Emergency System**: Real-time ambulance dispatch and tracking
- **Guest Access**: Emergency dispatch without authentication

## Roles

- `super_admin`: Full system access
- `admin`: Hospital management
- `doctor`: Patient care
- `driver`: Ambulance operations
- `user`: Patient access

## Environment Variables

### Client (.env)
```
VITE_SUPABASE_URL=https://cemaqackwtqkkqxlkttn.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=https://cemaqackwtqkkqxlkttn.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

## License

Private - Rodab Medical Hospital
