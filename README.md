# EcoMind AI — Carbon Footprint Intelligence Platform

> **PromptWars Virtual | Challenge 3** — Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

EcoMind AI is a full-stack web application powered by **Groq AI (Llama 3.3 70B)** that gives users a deeply personalized carbon footprint analysis, tracks progress over time, and generates a ranked action plan with quantified CO₂ savings.

---

## Chosen Vertical

**Environmental Sustainability / Personal Carbon Footprint**

The solution targets individuals who want to take meaningful climate action but don't know where to start. By combining real EPA emission data with AI-powered personalization, EcoMind makes carbon literacy accessible and actionable.

---

## Approach and Logic

### Assessment-First Architecture
The user completes a guided 6-screen assessment (Profile → 4 emission categories → Results):
1. **Transportation** — car type (EV/hybrid/gas/diesel/none), weekly mileage, flight frequency, public transit usage
2. **Home Energy** — monthly electricity (kWh), natural gas (therms), household size, home size, renewable energy
3. **Food & Diet** — diet type (vegan → high-meat), beef servings, dairy, food waste, local food sourcing
4. **Shopping** — purchasing frequency, clothing items, electronics, recycling habits

### Emission Calculation
All calculations use real-world emission factors from authoritative sources (EPA, IPCC, Our World in Data):
- Gasoline car: 0.404 kg CO₂e/mile
- US electricity grid: 0.386 kg CO₂e/kWh
- Beef: ~99.5 kg CO₂e/kg
- Results benchmarked against US average (16t), EU average (8.3t), world average (4.7t), and Paris 1.5°C target (2t)

### AI Personalization (3 Groq Endpoints)
1. **`/api/analyze`** — sends the full user profile + calculated breakdown to Llama 3.3 70B, receives a 6-section personalized markdown report (Carbon Story, Key Wins, Biggest Opportunities, Quick Wins, High-Impact Changes, 2030 Path)
2. **`/api/actions`** — generates 12 ranked personalized actions as structured JSON, sorted by annual CO₂ savings (kg), with difficulty ratings and profile-specific descriptions
3. **`/api/chat`** — maintains conversational context of the user's full profile across a persistent coaching session

### Decision Logic
- All AI prompts include the user's **actual numbers** (not generic advice)
- Actions are ranked by `annualSavingKg` descending — highest-impact changes surface first
- Carbon rating (Excellent → Very High) drives UI color coding and priority messaging
- Monthly history enables trend analysis: same-month entries are overwritten, keeping a 12-month rolling window

---

## How the Solution Works

```
User fills calculator → localStorage persists profile + breakdown
         ↓
Dashboard renders charts (Recharts donut + stacked bar)
         ↓
"Generate Analysis" → POST /api/analyze → Groq AI → markdown report
         ↓
"Generate My Actions" → POST /api/actions → Groq AI → 12 JSON actions
         ↓
AI Coach chat → POST /api/chat → Groq AI → context-aware response
```

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page with stats and feature overview |
| `/calculator` | 5-step guided emission assessment |
| `/dashboard` | Charts, benchmarks, equivalences, AI analysis |
| `/actions` | Ranked AI action center with commit/complete tracking |
| `/coach` | Persistent AI chat with suggested questions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Llama 3.3 70B via Groq API (free tier) |
| Charts | Recharts |
| Markdown | react-markdown |
| Storage | localStorage (client-side persistence) |
| Testing | Jest + ts-jest (115 unit tests, 5 suites, ~97% coverage) |
| Deployment | Google Cloud Run (Docker / standalone) |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd ecomind-ai
npm install

# 2. Get a FREE Groq API key at https://console.groq.com/keys
cp .env.example .env.local
# Edit .env.local: GROQ_API_KEY=gsk_...

# 3. Run development server
npm run dev

# 4. Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
  page.tsx              # Landing page
  calculator/page.tsx   # 5-step carbon calculator
  dashboard/page.tsx    # Charts + AI analysis dashboard
  actions/page.tsx      # Ranked AI action center
  coach/page.tsx        # Persistent AI chat interface
  api/
    analyze/route.ts    # AI personalized analysis endpoint
    chat/route.ts       # AI coaching chat endpoint
    actions/route.ts    # AI action generation endpoint
  error.tsx             # Global error boundary (App Router)
  not-found.tsx         # Custom 404 page
lib/
  carbon-calculator.ts  # EPA emission factors + calculation logic
  types.ts              # TypeScript interfaces
  store.ts              # localStorage persistence layer
  utils.ts              # Formatting + class-name helpers
  validation.ts         # Shared API input validation guards
  rate-limit.ts         # In-memory per-IP rate limiter
__tests__/
  carbon-calculator.test.ts  # Calculation engine (44 tests)
  utils.test.ts              # Formatting + cn helpers (29 tests)
  validation.test.ts         # Input validation guards (18 tests)
  store.test.ts              # localStorage layer (16 tests)
  rate-limit.test.ts         # Per-IP rate limiter (8 tests)
components/
  Navbar.tsx            # Navigation with active route highlighting
```

---

## Security

- **Input validation** — all API route inputs pass shared type guards (`lib/validation.ts`) before processing
- **Rate limiting** — per-IP limiter (20 req/min) on every AI endpoint returns `429` with `Retry-After` (`lib/rate-limit.ts`)
- **Content-Type enforcement** — non-JSON requests are rejected with `415`
- **Prompt-injection mitigation** — user strings are length-capped before inclusion in AI prompts
- **Schema validation** — AI-generated JSON (actions endpoint) is validated against the expected shape before use
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` set globally via `next.config.ts`
- **Secret hygiene** — API key is server-side only, never exposed to the client; `.env.local` is git-ignored
- **Zero known vulnerabilities** — `npm audit` reports 0 (transitive CVEs pinned via `overrides`)

---

## Testing

```bash
npm test           # run all tests
npm run test:coverage  # with coverage report
```

**115 unit tests across 5 suites (~97% statement coverage, enforced via `coverageThreshold`)** covering:
- Transport, energy, food, and shopping emission calculations (incl. diesel/hybrid/EV ordering, home-size and beef-serving effects)
- Full breakdown totals and category consistency
- Carbon rating thresholds and boundary values
- CO₂ equivalence calculations and linear scaling
- Formatting/utility helpers (tonnes, kg, category colors, month labels)
- Input validation guards (valid/invalid profiles and breakdowns, boundary lengths)
- localStorage persistence layer (save/load/toggle/clear, history rollover, chat truncation, corrupt-data recovery)
- Per-IP rate limiter (quota decrement, blocking, window reset, IP isolation)
- Edge cases: zero usage, renewable energy, vegan diet, empty state

---

## Assumptions

1. **Emission factors** are US-centric by default (EPA eGRID for electricity). Non-US users will see approximations.
2. **Flight mileage** is estimated from category (short/mixed/long) rather than exact routes.
3. **Household energy** is divided equally per person — actual per-person usage may vary.
4. **Shopping baseline** uses broad frequency categories; results are indicative rather than precise.
5. **localStorage** is used for persistence — data is device-local and not synced across devices.
6. AI-generated action savings are estimates based on published research; actual savings depend on individual behavior.

---

## Emission Factors (Sources)

| Category | Factor | Source |
|----------|--------|--------|
| Gasoline car | 0.404 kg CO₂e/mile | EPA |
| Electric vehicle | 0.095 kg CO₂e/mile | EPA |
| US electricity grid | 0.386 kg CO₂e/kWh | EPA eGRID |
| Natural gas | 5.3 kg CO₂e/therm | EPA |
| Beef | ~99.5 kg CO₂e/kg | Oxford Food Impact study |
| US average footprint | 16t CO₂e/year | Our World in Data / IEA |
| World average | 4.7t CO₂e/year | Our World in Data |

---

Built with Groq AI + Next.js for PromptWars Virtual | Challenge 3
