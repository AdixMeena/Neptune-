# Phoenix-AI — Rehabilitation, reimagined

A full-stack physiotherapy rehabilitation web app with Doctor Dashboard and Patient Dashboard.

---

## Screens included

### Shared
- **Login page** — role selector (Doctor / Patient), black canvas hero

### Doctor Dashboard
- **Patient overview** — stat cards, mini charts, searchable patient grid
- **Patient detail** — tabbed view: overview chart, exercises list, send feedback
- **Assign exercises** — category filter, multi-select, sticky assign bar

### Patient Dashboard
- **Home** — greeting, score, streak, today's exercises, progress chart
- **Exercise detail** — video placeholder, instructions, joint tracking info
- **Camera session** — full-screen AI pose detection simulation with animated skeleton
- **Score screen** — animated score counter, joint analysis breakdown
- **Feedback** — doctor messages with unread indicator

---

## Deploy options

### Option 1: Netlify (Recommended — free, ~2 minutes)

1. Go to [netlify.com](https://netlify.com) and sign up / log in
2. Drag and drop `frontend/dist/` onto the Netlify dashboard
3. Your site is live instantly with a public URL

Or via Netlify CLI:
```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 2: Vercel (free, ~2 minutes)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

When prompted: set output directory to `dist`.

### Option 3: GitHub Pages

1. Push this repo to GitHub
2. Go to Settings → Pages → Source: GitHub Actions
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend; npm install
      - run: cd frontend; npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Option 4: Local development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Option 5: Preview the production build locally

```bash
cd frontend
npm install
npm run build
npm run preview
```

Open http://localhost:4173

---

## Tech stack

- **React 18** + **React Router v6**
- **Recharts** for data visualisation
- **Vite** for build tooling
- Zero external UI libraries — design system built from scratch

## Demo credentials

Click "Sign in" without any credentials to enter the demo.
- Doctor role → Doctor Dashboard
- Patient role → Patient Dashboard (Arjun Mehta's account)

---

## Supabase SQL editor prompt

Use this in Supabase SQL Editor to add the connections table and RLS policies:

```sql
create extension if not exists "uuid-ossp";

create table if not exists public.connections (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references auth.users(id) on delete cascade,
  doctor_id   uuid not null references auth.users(id) on delete cascade,
  status      text not null check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz default now(),
  unique (patient_id, doctor_id)
);

alter table public.connections enable row level security;
create policy "Patients can create requests" on public.connections for insert with check (
  auth.uid() = patient_id
);
create policy "Patients can view their connections" on public.connections for select using (
  auth.uid() = patient_id
);
create policy "Doctors can view their connections" on public.connections for select using (
  auth.uid() = doctor_id
);
create policy "Doctors can update request status" on public.connections for update using (
  auth.uid() = doctor_id
);
```

## Design system

Apple-inspired precision editorial system. See the full spec in the project document.
Colors, typography, and components are all implemented as inline styles matching the spec exactly.
