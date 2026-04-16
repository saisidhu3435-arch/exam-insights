# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, Wouter routing, Framer Motion, TanStack Query)

## Applications

### Minute Ahead (`artifacts/minute-ahead`)
Student-focused news platform for CLAT/AILET exam prep and general knowledge. 
- Clean "Today's Updates" section with clickable news cards
- Onboarding flow: goal selection + time preference (2/5/10 min)
- Article detail pages with CLAT/AILET exam relevance notes
- Like/dislike reactions with anonymous session tracking
- Browse by category
- Personalized feed based on user preferences

### API Server (`artifacts/api-server`)
Express 5 REST API serving all news data.
Routes:
- `GET /api/news` — list articles (filter by category, timeMode)
- `GET /api/news/today` — today's top updates (personalized by goal + timeMode)
- `GET /api/news/categories` — all categories with counts
- `GET /api/news/:id` — single article detail
- `POST /api/reactions` — like/dislike an article
- `GET /api/reactions/:articleId` — get reaction counts
- `GET /api/preferences` — get user preferences (by sessionId query param)
- `POST /api/preferences` — save user preferences

## Database Schema (PostgreSQL)
- `news_articles` — articles with headline, summary, fullExplanation, category, tags, readingTime, likes, dislikes, examRelevance
- `reactions` — per-session reactions (like/dislike/none)
- `user_preferences` — onboarding choices: goal + timeMode

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-news` — seed news articles

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
