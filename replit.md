# NutraFit AI Backend

## Overview

Node.js + Express backend for the NutraFit AI nutrition app, designed to pair
with the existing Lovable frontend at https://my-desi-nutrition.lovable.app.

## Stack

- Node.js 24, Express 5, TypeScript
- PostgreSQL via Drizzle ORM (Replit built-in DB; replaces the originally
  requested MongoDB Atlas to avoid external credentials)
- OpenAI via Replit AI Integrations proxy (no API key required)
- Multer for image uploads
- CORS enabled for any origin (Lovable frontend included)

## API Endpoints (all under `/api`)

- `GET  /healthz`              — health check
- `POST /user`                 — create user (auto-computes BMI)
- `GET  /user[?id=]`           — fetch a user (most recent if no id)
- `POST /food`                 — log a food entry
- `GET  /food[?userId=]`       — list food logs
- `POST /scan-food`            — multipart `image` (or JSON `imageUrl`/`imageBase64`); returns AI nutrition
- `POST /meal-plan`            — AI Indian meal plan
- `POST /recipe`               — AI recipe from ingredients
- `POST /chat`                 — chatbot reply
- `POST /health-guide`         — foods to eat/avoid for a condition

## Database Tables

- `users` — id, name, age, height, weight, bmi, preferences, allergies[], dislikes[], cuisine_preference, health_condition
- `food_logs` — id, user_id, food_name, calories, nutrients, date

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — run server locally
- `pnpm --filter @workspace/db run push` — push schema changes
