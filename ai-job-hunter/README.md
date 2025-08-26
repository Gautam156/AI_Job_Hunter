# AI Job Hunter (v2, Real Backend)

> Stage-1 ready: Free plan with daily limits, real OpenAI cover letters, real JSearch job search, Stripe scaffolding for Pro.

## Folder Structure
```
ai-job-hunter/
├─ manifest.json
├─ assets/
├─ popup/
├─ profile/
├─ options/
├─ scripts/
└─ server/        # Deploy to Vercel as a separate project
```

## Quick Start (Frontend – Extension)
1. Open Chrome → `chrome://extensions/` → toggle **Developer mode**.
2. Click **Load unpacked** → select the `ai-job-hunter/` folder.
3. Edit `scripts/config.js` and set:
```js
export const API_BASE = 'https://YOUR-VERCEL-APP.vercel.app/api';
```
4. Click the extension icon → open **Profile** → fill your details.

## Deploy Backend (Vercel)
Create a new Vercel project and point it to the `server/` folder.

### Environment Variables
Set these in Vercel project settings:
- `OPENAI_API_KEY`
- `RAPIDAPI_KEY` (JSearch on RapidAPI)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (the price for your subscription)
- `STRIPE_WEBHOOK_SECRET` (after creating a webhook)
- `ALLOWED_ORIGINS` (during dev: `*`, later restrict to `chrome-extension://<YOUR_ID>`)
- Optional: `FREE_LIMIT_COVER=3`, `FREE_LIMIT_JOBS=5`

### Notes
- This backend uses **in-memory** counters for daily limits (works for a demo; may reset on cold starts). For production, add a DB (e.g., Supabase) and store `{ userId, date, coverCount, searchCount, plan }`.
- Stripe webhook currently logs activation. Persist plan=pro in a DB and add a `/me` endpoint returning the plan by `userId` to the extension.

## Features
- ✍️ Cover letters via OpenAI (`/api/cover-letter`)
- 🔎 Job search via RapidAPI JSearch (`/api/jobs`)
- 💳 Stripe Checkout scaffolding (`/api/stripe/create-session`, `/api/stripe/webhook`)
- 🔒 Free plan limits (client & backend): 3 cover letters/day, 5 job searches/day

## Roadmap (Stage-2)
- Add DB + `/api/me` to return real plan.
- On webhook success, update plan in DB.
- In the extension, fetch plan from backend and sync to `chrome.storage`.

## Security
- Never put API keys in the extension.
- Set strict `ALLOWED_ORIGINS` for CORS when you publish.
- Add a Privacy Policy before publishing to Chrome Web Store.

---
Generated on 2025-08-26.
