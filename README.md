# Family Hub OS

A production-grade, widget-based “family operating system” built with:
Next.js (App Router), TypeScript (strict), Tailwind CSS, shadcn-style UI primitives, Zustand (local persistence), React Query (mock services), Framer Motion (micro-animations), and `react-grid-layout` (drag/resize/reorder).

All important daily info lives on one personalized page: schedules, teams, SpaceX, Tesla, news, quick links, message board, and more.

## Features (what you can do right now)

- Drag and resize widgets on the main grid
- Hide/show widgets
- Collapse/expand widgets
- Persistent layout + preferences via `localStorage`
- Global search (matches schedules, quick links, and messages)
- Settings panel:
  - Manage family members
  - Favorite sports teams
  - Quick links
  - Theme + compact mode
  - Time zones (for the World Clock widget)
  - Widget Manager modal (hide/collapse + reset layout)

## Getting Started

From `family-hub-os/`:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project Structure (key files)

- `app/`
  - `page.tsx`: renders the dashboard
  - `layout.tsx`: app shell + global CSS
  - `providers.tsx`: React Query provider
- `components/dashboard/`
  - `FamilyHubDashboard.tsx`: header + settings + widget grid
  - `FamilyHeader.tsx`: global search + family selector
  - `SettingsDrawer.tsx`: settings panel + widget manager entrypoint
  - `WidgetManagerModal.tsx`: widget visibility/collapse + layout reset
- `components/widgets/`
  - 10 production widgets (SpaceX, Sports, Schedule, Screenshot→Schedule, Messages, Quick Links, Knott’s, World Clock, News, Tesla)
  - `WidgetGrid.tsx`: drag/resize + persistent layout
  - `WidgetShell.tsx`: shared widget header controls
- `store/`
  - `familyHubStore.ts`: Zustand state + localStorage persistence
- `types/`
  - `familyHub.ts`, `layout.ts`, and other typed models used by widgets
- `data/`
  - `seed.ts`: realistic demo data (members, teams, schedules, links, etc.)
- `lib/services/`
  - mock APIs (designed to be swapped later)
  - `spacexService.ts`, `sportsService.ts`, `newsService.ts`, `teslaService.ts`, `knottsService.ts`, `screenshotParserService.ts`

## Replacing Mock APIs with Real APIs

Each widget fetches data through a service abstraction in `lib/services/`.
To wire real backends:

1. Implement real functions in the relevant service file.
2. Keep the same return types (the widget layer expects normalized, typed data).
3. Update only service internals; the Zustand store and widgets should remain unchanged.

Example:
- Replace mock SpaceX in `lib/services/spacexService.ts` with a real launch API client.
- Replace sports mocks in `lib/services/sportsService.ts` with ESPN/StubHub/etc. integration (or your own backend).

## Notes

- Persistence is currently browser-only (`localStorage`) for simplicity.
- All widgets are built to work with the seeded mock data from `data/seed.ts`.

