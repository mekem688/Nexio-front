# Nexio — Frontend

React + TypeScript + Vite frontend for the Nexio messaging app.

## Stack
- React 18 + TypeScript
- Vite (build & dev server)
- TanStack Query v5
- Shadcn/ui + Tailwind CSS
- Wouter (routing)

## Development

```bash
npm install
npm run dev
```

The dev server runs on port 5000 and proxies `/api/*` and `/ws` to the backend (port 8000 by default).

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | URL of the deployed backend (empty in dev) |

## Deploy on Vercel

Import this repo on Vercel — `vercel.json` handles everything automatically.  
Add `VITE_API_BASE_URL` in the Vercel project settings.
