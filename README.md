![CI](https://github.com/Saqlain2003/url-shortener/actions/workflows/ci.yml/badge.svg)

# 🔥 FEWER — URL Shortener

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> **Fewer characters to carry.** A production-grade URL shortening service built as a hands-on System Design learning project.

## 📖 Overview

**Fewer** is a production-grade URL shortener built as an intensive, hands-on System Design learning project. Rather than a simple "store URL, return short code" service, this explores **the entire stack of what makes systems scale, remain reliable, and provide visibility into production behavior.**
 
### What This Actually Is
 
Most tutorial URL shorteners are 50 lines of CRUD. Fewer is:
 
- 🔬 **A performance case study** — achieving 102x speedup through cache-aside patterns, with benchmarked results (4.42ms avg latency, 10K+ req/sec on a single machine)
- 🏗️ **An architecture deep-dive** — decisions documented (why cache-aside over write-through, why soft-delete over hard-delete, why Redis INCR over UUIDs) with tradeoffs explicitly analyzed
- 🔄 **A durability exploration** — BullMQ job queues that survive process crashes, preserving data integrity even in failure scenarios
- 📊 **An observability showcase** — structured logging with correlation IDs, Sentry error tracking, and health checks that give you visibility into production behavior
- 🚀 **A scalability demonstration** — tested horizontal scaling (two instances behind Nginx load balancer, stateless design allowing unlimited replicas)
- 🐳 **A real deployment** — containerized with Docker (separate dev and production images) and deployed live via Render (backend + Redis) and Vercel (frontend), not just running on localhost
- ✅ **A testing-first codebase** — 45+ automated tests covering unit, integration, and system-level scenarios, running in CI without external dependencies

### The Real Depth
 
Rather than hand-wavy explanations, this project **measures and proves** its claims:
 
| Metric | Result | Significance |
|--------|--------|-------------|
| **Redirect latency (cached)** | 4.42ms | Real-world SLA-meeting performance |
| **Redirect latency (uncached)** | 452ms | Clear signal of why caching matters |
| **Speedup factor** | 102x | Not theoretical — benchmarked with autocannon |
| **Throughput improvement** | 99x (101 → 10,068 req/sec) | Horizontal scaling proves statelessness |
| **Test coverage** | 45+ tests, 80%+ coverage | Production-confidence testing |
| **Database query optimization** | 10-15ms analytics aggregation | Indexed queries, MongoDB aggregation pipeline |
| **Async job durability** | Redis-persisted, survives crashes | BullMQ + ioredis ensures no data loss |
 
### Technology Decisions With Reasoning
 
Every choice is deliberate and documented:
- **Redis INCR + Base62** instead of UUIDs because deterministic, collision-free, and scales without DB round-trips
- **Cache-aside pattern** instead of write-through because read-heavy, decouples cache from truth, allows explicit invalidation
- **Soft-delete (is_active flag)** instead of hard-delete because preserves analytics history for auditing and analysis
- **Cron job for expiration** instead of MongoDB TTL index because can invalidate Redis cache simultaneously, preventing stale reads
- **BullMQ for analytics** instead of in-process async because survives process crashes — data durability is non-negotiable
- **mongodb-memory-server for tests** instead of real MongoDB because fast, self-contained, no external service dependency in CI
This is **engineering thinking**, not feature building.
 
---

## ✨ Features

### Core Product Features

- 🔗 **Instant URL shortening** — anonymous or authenticated users can shorten URLs without friction
- ⚡ **Sub-5ms cached redirects** — Redis cache-aside pattern delivers 102x speedup; median redirect latency 4.42ms
- 🎯 **Custom aliases** — users define their own short codes (3-20 chars, alphanumeric), not randomly generated
- ⏰ **Link expiration** — optional TTL; cron job soft-deletes expired links while simultaneously invalidating Redis cache
- 🔐 **JWT authentication** — signup/login with bcryptjs password hashing + stateless JWT tokens (no sessions)
- 📊 **Per-link analytics** — tracks every click with geolocation (country/city), referrer, user-agent, timestamp
- 📈 **Time-series analytics** — aggregates daily click counts with gap-filling (shows zero-click days, not just data points)
- 🌐 **3D interactive globe** — React Three Fiber + WebGL visualization showing click distribution by country with intensity mapping
- 🎨 **QR code generation** — generates PNG on-demand, downloadable or embeddable as base64 data URL

### Advanced Architecture Features

- 🚀 **Horizontal scaling** — stateless design tested with Nginx load-balancing two instances; round-robin proves no per-server state
- 🔄 **Durable async processing** — BullMQ job queue persists click events to Redis before process exits; worker survives crashes and processes backlog
- ⚡ **Real-time updates (SSE + Redis Pub/Sub)** — replaced wasteful 5-second polling with push-based updates; see dedicated section below for the full design
- 💾 **Smart cache invalidation** — on link update/delete, cache is cleared before response; subsequent reads hit fresh DB data, no stale reads possible
- 🛡️ **Rate limiting** — fixed-window Redis counter per user ID or IP; fail-open (lets request through if Redis down); protects against brute force and DoS
- 🪵 **Structured logging** — Pino JSON logs with request correlation IDs; trace a single user's request through entire system
- 🚨 **Error tracking** — Sentry integration auto-reports exceptions to dashboard; production errors visible without log hunting
- 📖 **OpenAPI documentation** — Swagger UI at `/api-docs`; interactive endpoint testing built into docs
- ✅ **45+ automated tests** — unit + integration covering all layers; mongodb-memory-server means tests run in CI without external MongoDB/Redis
- 🔄 **CI/CD pipeline** — GitHub Actions runs full test suite on every push/PR; only green builds can merge

### Production-Readiness Features

- 🏥 **Health checks** — `/health/live` (is server running?) and `/health/ready` (are DB + Redis up?) enable Kubernetes readiness probes
- 📊 **Performance monitoring** — benchmarked with autocannon; results show 102x speedup and sub-5ms latency at scale
- 🔒 **Security headers** — Helmet.js enforces CSP, X-Frame-Options, X-Content-Type-Options; HTTPS redirect via Nginx X-Forwarded-Proto
- 🔑 **URL validation** — rejects non-http(s) URLs; prevents javascript: and file: protocol injection
- 🌐 **CORS-aware** — stateless, no cookies (JWT only); works behind proxies and load balancers
- 📈 **Database optimization** — compound indexes on (short_code, timestamp) for time-series queries; aggregation pipeline in MongoDB reduces network transfer

---

## 🏗️ Architecture Decisions
 
| What | Decision | Why |
|------|----------|-----|
| **ID Generation** | Redis INCR → Base62 | Deterministic, no collision retries, 62^7 = 3.5T combos |
| **Caching** | Cache-aside, TTL 3600s | Decouples cache from truth; explicit invalidation |
| **Negative cache** | Store NULL_SENTINEL 60s | Prevent repeated DB hits for 404s |
| **Expiration** | Cron job (soft-delete) | Preserves analytics history; invalidates cache simultaneously |
| **Analytics** | Fire-and-forget via BullMQ | Never blocks redirects; Redis persistence survives crashes |
| **Auth** | optionalAuth + protect | Support both anonymous + authenticated users |
| **Test DB** | mongodb-memory-server | Fast, no external service, perfect for CI |

## 📊 Performance: Cache-Aside Impact (Day 3 Benchmark)
 
Load tested locally with `autocannon` (50 concurrent connections, 10 second duration) against the same redirect endpoint, with and without the Redis cache-aside layer.
 
| Metric | No Cache | Cached | Improvement |
|---|---|---|---|
| Avg latency | 452.35 ms | 4.42 ms | ~102x faster |
| Median (p50) latency | 278 ms | 4 ms | ~70x faster |
| p99 latency | 1043 ms | 10 ms | ~104x faster |
| Avg req/sec | 101.4 | 10,068.6 | ~99x more throughput |
| Requests served in 10s | 1,014 | 101,000 | ~100x more traffic handled |
 
**Takeaway:** with MongoDB queried on every redirect, the service handled ~100 req/sec. With Redis cache-aside in front of it, the same service handled ~10,000 req/sec on identical hardware — confirming that database I/O, not application logic, was the bottleneck on the redirect path.
 
*Note: these numbers were captured against a local MongoDB/Redis instance with minimal data and no network latency — real-world gaps under production load (larger dataset, network hops, concurrent write load) will differ, though the underlying pattern holds.*

---

## ⚡ Real-Time Updates — SSE + Redis Pub/Sub
 
**The problem:** Initially, the dashboard and analytics pages polled the backend every 5 seconds to check for new clicks. This wastes requests when nothing has changed, and still has up to a 5-second delay — not truly real-time.
 
**The fix:** Server-Sent Events (SSE) push data to the browser only when something actually happens, over a single long-lived HTTP connection. But SSE alone isn't enough once you've horizontally scaled — a click landing on Backend Instance 2 has no way to notify a browser connected to Backend Instance 1. **Redis Pub/Sub bridges that gap**, acting as a shared message bus between server instances.
 
### Channel design (the interesting part)
 
Rather than one channel per link — which would mean one SSE connection per link shown on the dashboard (50 links = 50 open connections, doesn't scale) — channels are scoped by **audience**:
 
| Channel | Scope | Who subscribes |
|---|---|---|
| `clicks:<shortCode>` | One specific link | Analytics detail page for that link |
| `dashboard:<userId>` | Every link a user owns | The user's dashboard (one connection, any number of links) |
 
Every click **fans out to both channels** — the click processor publishes to the link-specific channel AND the owning user's dashboard channel in the same operation. This is "fan-out on write": a small cost at write time (one extra `PUBLISH`) buys a cheap, constant-size read side (one SSE connection per consumer, regardless of data volume).
 
### Implementation notes
- Publishing reuses the existing Redis connection (`PUBLISH` doesn't change connection state)
- Subscribing requires a **dedicated Redis connection** — once a connection calls `SUBSCRIBE`, Redis locks it into subscriber-only mode; it can no longer run `GET`/`SET`/`INCR`
- Each SSE handler unsubscribes and cleans up its listener on `req.on('close', ...)` to avoid leaking subscriptions when browser tabs close

---

## 🛠️ Tech Stack
 
**Backend:** Node.js (ESM) + Express + MongoDB + Redis + BullMQ  
**Real-time:** Server-Sent Events (native) + Redis Pub/Sub  
**Frontend:** React + Vite + Three.js + GSAP + Recharts  
**Logging:** Pino + pino-http (correlation IDs)  
**Monitoring:** Sentry  
**Testing:** Vitest + Supertest + mongodb-memory-server  
**CI/CD:** GitHub Actions  
**Containerization:** Docker (separate dev + production images), Docker Compose, GitHub Codespaces `.devcontainer`  
**Infrastructure:** Nginx (load balancing),   
**Hosting:** MongoDB Atlas (database) + Render (backend + Redis) + Vercel (frontend) 

---
 
## 🗂️ Project Structure

```
url-shortener/
├── 🐳 .devcontainer/
│   └── devcontainer.json     # GitHub Codespaces config (forwards ports, extensions)
├── 🔙 backend/
│   ├── 🔧 src/
│   │   ├── ⚙️  config/        # db, redis, logger, swagger, sentry
│   │   ├── 🗄️  models/        # Url, User, ClickEvent schemas
│   │   ├── 🎮 controllers/   # HTTP handlers
│   │   ├── 🛠️  services/      # business logic, analytics, click processor
│   │   ├── 🛣️  routes/        # API endpoints
│   │   ├── 🚦 middlewares/   # auth, rate limiting
│   │   ├── 📦 queues/        # BullMQ configuration
│   │   ├── 👷 workers/       # async job processors
│   │   ├── ⏰ jobs/          # cron tasks (expiration)
│   │   └── ✅ tests/         # 45+ tests covering all layers
│   ├── 🐳 Dockerfile         # dev image (nodemon, hot-reload, bind-mounted)
│   ├── 🐳 Dockerfile.prod    # production image (multi-stage, non-root, dumb-init)
│   ├── 📄 server.js          # entry point
│   └── 📋 package.json
│
├── 🎨 frontend/
│   ├── 🔧 src/
│   │   ├── 🧩 components/    # Navbar, Logo, Headlines, etc.
│   │   ├── 📄 pages/         # Landing, Dashboard, Analytics (future)
│   │   ├── 🌐 api/           # HTTP client wrappers (url, auth, analytics)
│   │   └── 🌍 context/       # AuthContext for global state
│   ├── 🐳 Dockerfile         # dev image (Vite dev server, hot-reload)
│   └── 📋 package.json
│
├── 🔄 nginx/                 # load balancer config
├── 🔨 .github/workflows/      # GitHub Actions CI
├── 📄 docker-compose.yml      # (planned)
└── 📖 JOURNAL.md              # this file
└── 📖 README.md              # this file
```
 
---

## 🛠️ Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js)
* [MongoDB](https://www.mongodb.com/) — local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
* [Redis](https://redis.io/) — local instance or a free-tier hosted instance (e.g., Redis Cloud, Upstash)
* A REST client for testing endpoints, e.g., [Postman](https://www.postman.com/) or [Thunder Client](https://www.thunderclient.com/)
* [autocannon](https://github.com/mcollina/autocannon) (optional, for load testing) — `npm install -g autocannon`


## 🚀 Installation
Follow these steps to set up the project locally.

1. **Clone the repository**
   ```bash
      git clone https://github.com/Saqlain2003/URL-Shortener.git
      cd url-shortener
   ```
 
2. **Install dependencies**
   ```bash
      npm install
   ```
 
3. **Set up environment variables**
   Create a `.env` file in the project root:
   ```env
      PORT=5000
      MONGO_URI=your_mongodb_connection_string
      REDIS_URL=redis://localhost:6379
      JWT_SECRET=your_jwt_secret
   ```
 
4. **Start MongoDB and Redis** (if running locally)
   ```bash
      mongod
      redis-server
   ```
 
5. **Run the server**
   ```bash
      node server.js
   ```
 
6. **Verify it's running**
   Visit `http://localhost:5000/health` — you should see:
   ```json
      { "status": "ok" }
   ```

---

## 🚀 Quick Start
 
### Option A — Docker Compose (recommended, works in GitHub Codespaces)
```bash
# From repo root — spins up backend, frontend, MongoDB, and Redis together
docker compose up -d
 
# Watch logs for a specific service
docker compose logs -f backend
 
# Stop everything
docker compose down
```
This uses the **dev** Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) — hot-reload via nodemon and Vite, source bind-mounted so edits apply instantly without rebuilding.
 
### Option B — Manual (without Docker)

### Backend
```bash
cd backend
npm install
cp .env.example .env  # edit with MongoDB URI, Redis URL, JWT secret
npm run dev           # starts server + analytics worker
npm test              # run 45+ tests
```
 
### Frontend
```bash
cd frontend
npm install
echo "VITE_API_BASE=http://localhost:5000" > .env
npm run dev
```
 
### Load Testing (Nginx)
```bash
# Terminal 1-2: run two backend instances
PORT=5001 node server.js
PORT=5002 node server.js
 
# Terminal 3: hit Nginx on port 8080 (load-balances between 5001, 5002)
curl http://localhost:8080/r  # redirects a link
```
 
---

## 🐳 Docker & Deployment
 
### Development — GitHub Codespaces
The `.devcontainer/devcontainer.json` config launches the whole stack inside Codespaces automatically:
- Forwards ports 5173 (frontend), 5000 (backend), 27017 (Mongo), 6379 (Redis)
- Dev Dockerfiles run `nodemon`/`vite --host` for instant hot-reload on save
- Bind-mounted volumes mean file edits apply without a rebuild — only `docker compose down && up --build` is needed after installing a new dependency
### Production images are separate from dev images
The dev Dockerfiles are optimized for iteration speed, not security or size — they run as root and include dev tooling. A dedicated `backend/Dockerfile.prod` is used for actual deployment:
- Multi-stage build (`npm ci --omit=dev` in a builder stage, only `node_modules` + source copied to the runtime stage)
- Runs as a **non-root user** with correct file ownership (`--chown` at copy time, not a `chown` layer after)
- `dumb-init` as PID 1 for correct signal handling (graceful shutdown)
- Built-in `HEALTHCHECK` hitting `/health/live`
- No nodemon, no bind mounts — code is baked into the image
### Deployed to
| Piece | Platform | Notes |
|---|---|---|
| Database | MongoDB Atlas (free tier) | Network access configured for Render's dynamic IPs |
| Redis | Render Redis | Internal URL used (same region as backend, faster + more secure) |
| Backend | Render (Docker Web Service) | Built from `backend/Dockerfile.prod`; free tier cold-starts after 15 min idle |
| Frontend | Vercel | Native Vite build (no Docker needed for static frontend hosting) |
 
**Wiring it together:** the backend's `FRONTEND_URL` env var drives CORS (`origin: process.env.FRONTEND_URL`), and the frontend's `VITE_API_BASE` points at the deployed backend URL — both set as platform environment variables, never committed to git.
 
---
 
## 📡 API Overview
 
**Shorten:** `POST /shorten` (anonymous or authenticated)  
**Redirect:** `GET /:shortCode` (302 to original URL)  
**My Links:** `GET /api/urls/my` (requires auth)  
**Analytics:** `GET /api/analytics/:shortCode` (aggregated by referrer, country)  
**Time-series:** `GET /api/analytics/:shortCode/timeseries?days=7` (daily click counts)  
**Live analytics stream:** `GET /api/analytics/:shortCode/stream` (SSE — pushes click updates for one link)  
**Live dashboard stream:** `GET /api/urls/my/stream` (SSE — pushes click updates for every link the authenticated user owns)
**Auth:** `POST /api/auth/signup`, `POST /api/auth/login`  
**Health:** `GET /health/live` (is server running?), `GET /health/ready` (are deps up?)  
 
**Full docs:** `GET /api-docs` (interactive Swagger UI)
 
---

## 🧪 Testing
 
```bash
npm test              # 45+ tests pass
npm run test:watch   # watch mode
```
 
**Coverage:** URL shortening, auth (signup/login), analytics (click recording, aggregation), time-series queries, cache invalidation, link expiration, rate limiting, async job enqueueing.
 
**No external deps needed** — mongodb-memory-server spins up in-process, Redis fully mocked.
 
---
 
## 🎨 Design & Theme
 
**"Sun Breathing"** aesthetic (inspired by Demon Slayer):
- Dark background (`#0A0806`) + flame orange/red accents (`#FF6B35`, `#D62828`)
- **Logo:** Flaming "F" monogram (scalable 16px favicon → 300px hero)
- **Hero fire:** WebGL shader (React Three Fiber) with procedural noise turbulence scrolling upward
- **Headline:** GSAP letter-by-letter ignition animation + hover glow
- **Buttons:** Orange gradient matching flame theme

---

## 🔍 Known Limitations & Future Work
 
### Limitations (Documented, Accepted)
 
**Performance & Scale (the "what happens at 1000x" questions):**
- ❌ Cache stampede (concurrent misses → DB thrashing)  
  *Fix:* Redis SET NX EX mutex before DB query
- ❌ Cache avalanche (identical TTLs → mass expiry)  
  *Fix:* Random TTL jitter
- ❌ Single Redis INCR for ID generation (SPOF; also a data-loss risk if Redis crashes between snapshots)  
  *Fix:* Range/segment-based ID allocation per instance (`INCRBY` a block of 1,000 at a time), and enable AOF persistence (`appendfsync everysec`) to shrink the durability gap
- ❌ BullMQ worker inserts click events one at a time (`ClickEvent.create()` per job) — wouldn't hold up under a viral traffic spike  
  *Fix:* Batch writes with `ClickEvent.insertMany(batch, { ordered: false })`, flushing on a time or size threshold
- ❌ Expiration cron relies on a compound index, not MongoDB's native TTL index (soft-delete requirement conflicts with TTL's hard-delete behavior)  
  *Fix at extreme scale:* Redis Sorted Set (`ZADD` by expiry timestamp) to avoid touching MongoDB until there's actually something to expire
- ❌ Rate limiting is application-layer only — a scripted attacker's requests still reach the Node process before being rejected  
  *Fix:* Edge-layer protection (e.g., Cloudflare) in front of Nginx, plus a sliding-window algorithm instead of fixed-window to close the window-boundary burst gap
**User Experience:**
- ❌ **Anonymous link persistence** — anonymous users lose link history after tab close
  - *Note:* Accepted tradeoff (zero friction, encourages signup)
  - *Future fix:* Session cookies (90-day persistence, Option 3) or force auth
**Architecture:**
- ❌ No refresh tokens (JWT expires → forced logout)  
- ❌ No account lockout (brute force not rate-limited per email)  
- ❌ MongoDB single node (no HA, crash = data loss risk) — see the Database Choice question in Interview Prep below  
- ❌ Service-level correlation IDs not threaded to services  
- ❌ **No admin dashboard** (deferred as future improvement)
  - *Rationale:* Core HLD already proven; deployment is priority; operational tool, not product validation
**Frontend:**
- ❌ Settings page (profile, password change) — not yet built
- ❌ TypeScript migration (deferred to next project for higher learning value)
- ❌ 3D globe visualization on the analytics page (planned enhancement, not required for the core real-time analytics to work)

---
 
## 💡 Design Rationale
 
### Why Anonymous Shortening is Accepted
 
✅ **Zero friction** — most users try before signing up  
✅ **Links still work** — globally accessible, just not manageable by that user  
✅ **Conversion hook** — "sign up to save your links"  
✅ **Simpler arch** — avoids session management complexity  
 
*Future:* Session cookies (90-day TTL) would add persistence without mandatory signup.
 
### Why Admin Dashboard is Deferred
 
✅ **Core HLD is proven** — caching, async, rate limiting, analytics, load balancing all demonstrated  
✅ **Admin is CRUD/tables** — not architectural learning; would add 2-3 days  
✅ **Deployment is the signal** — live working product > perfect local code  
✅ **Can be added later** — "I launched, then added admin monitoring" is stronger portfolio narrative  
 
*Scope:* Would include: total users, global traffic heatmap, link flagging, performance metrics, user suspension.
 
---
 
## 📊 Observability
 
- ✅ **Pino logging** (JSON structured, HTTP correlation IDs)  
- ✅ **Sentry error tracking** (production exceptions auto-reported)  
- ✅ **Health checks** (/health/live, /health/ready)  
- ❌ APM tracing (future)  
- ❌ Prometheus metrics (future)
---
 
## 🔐 Security Checklist
 
- ✅ Helmet.js (CSP, X-Frame-Options, X-Content-Type-Options, etc.)  
- ✅ HTTPS enforcement (X-Forwarded-Proto check via Nginx)  
- ✅ JWT signing with strong secret (32+ chars)  
- ✅ bcryptjs password hashing (10+ rounds)  
- ✅ URL validation (http/https only, no javascript: or file:)  
- ✅ Rate limiting (prevents brute force, DoS)  
- ⚠️ Rate limiter assumes trusted proxy (X-Forwarded-For spoofing possible)  
- ⚠️ No URL malware scanning (phishing/malware URLs not flagged)
---
 
## 🎯 What This Demonstrates
 
### High-Level Design & Scalability (The Core Learning)
- ✅ **Cache-aside pattern** — understands when to cache (read-heavy), how to invalidate (explicit), and impact of TTL decisions (gap-filling)
- ✅ **Async processing with durability** — uses BullMQ + Redis to decouple fire-and-forget operations from request path; survives crashes
- ✅ **Horizontal scaling** — stateless design, shared dependencies (MongoDB, Redis), proven with Nginx load-balancing two instances
- ✅ **Rate limiting strategies** — fixed-window, Redis-backed, understands fail-open behavior and why per-IP/per-user matters
- ✅ **Database optimization** — compound indexes, aggregation pipelines, query performance measurement (10-15ms on analytics queries)
- ✅ **Soft vs hard deletes** — preserves data history for analytics while marking inactive; not just a feature, an architectural decision
### Full-Stack Development (Execution)
- ✅ **Modern Node.js backend** — Express.js with proper middleware ordering (auth → rate limit → handler), ESM modules, structured error handling
- ✅ **Contemporary frontend** — React 18 with Vite (no webpack bloat), component composition, context API for state, API client abstraction
- ✅ **Real-time data viz** — WebGL shaders (Three.js) for performance, GSAP for animation sophistication, Recharts for analytics charts
- ✅ **REST API design** — thoughtful endpoint organization (/api/urls/my for user scope, /api/analytics/:code for drill-down, /health/* for ops)
- ✅ **OpenAPI documentation** — JSDoc comments compiled to Swagger; interactive testing built into docs
- ✅ **Authentication at scale** — JWT tokens (stateless), bcryptjs hashing (defensive against brute force), separate optionalAuth for anonymous users
### DevOps & Production Readiness (Maturity Signal)
- ✅ **Structured logging** — Pino JSON output with correlation IDs; not console.log; request tracing across components
- ✅ **Error tracking** — Sentry integration (not just logging); production errors roll up to a dashboard without manual log hunting
- ✅ **Health checks** — /health/live and /health/ready enable Kubernetes deployment; shows ops understanding
- ✅ **Security headers** — Helmet.js configured; HTTPS enforcement; URL validation; not an afterthought
- ✅ **CI/CD maturity** — GitHub Actions runs full test suite on every push; only green builds allowed; automated validation
- ✅ **Performance measurement** — autocannon benchmarks show concrete 102x speedup; not "it's fast," it's "4.42ms p50 latency"
### Software Engineering Craft (Signals Maturity)
- ✅ **Comprehensive testing** — 45+ tests covering unit (base62, validators), integration (routes + real DB + cache), and system (rate limiter, expiration job)
  - Tests are in CI; they run without external services (mongodb-memory-server, Redis mock)
  - Not just "we have tests," but tests that guard against real bugs (cache invalidation, race conditions, soft-delete edge cases)
- ✅ **Git discipline** — meaningful commit messages, atomic commits, one feature per PR (not "fix stuff")
- ✅ **Decision documentation** — README doesn't just list features; it explains *why* each architectural choice was made and what the tradeoff was
- ✅ **Honest about limitations** — Known Limitations section is substantial and non-defensive; shows critical thinking, not perfection-seeking
- ✅ **Tradeoff analysis** — admin dashboard is deferred with explicit reasoning; anonymous users lose persistence with clear justification; not a cop-out, a design decision
### What This Signals to Evaluators
1. **You understand systems at scale** — caching, async processing, load balancing aren't theoretical; you've implemented and measured them
2. **You write production code** — error handling, logging, monitoring, health checks; not just "does it work," but "can I operate it"
3. **You can communicate architecture** — decisions are explained, tradeoffs documented, not hidden behind code
4. **You ship, you don't just build** — CI/CD, tests in cloud, documented limitations, benchmarks; signs of someone who thinks about whole lifecycle
5. **You're humble about scope** — clear about what's NOT built (admin dashboard, TypeScript, refresh tokens) and why; shows judgment

---

## 🎓 Interview Prep — System Design Deep-Dive Q&A
 
These are the five hardest questions this project has faced under review — the kind that separate "I built a tutorial" from "I understand distributed systems." Kept here so the reasoning survives, not just the code.
 
### 1. Redis INCR fault tolerance — what if Redis crashes right after handing out an ID?
Redis's default RDB snapshotting only persists periodically, not on every write — a crash between snapshots loses recent `INCR` values, and the next `INCR` on reboot can re-issue an ID that was already handed out.
- **Fix:** Enable AOF persistence (`appendfsync everysec`) to shrink the loss window to ~1 second.
- **Better fix:** Range/segment-based allocation — each instance grabs a block of IDs (`INCRBY counter 1000`) and hands them out locally, so a crash loses at most one unused block, not a live collision, and removes Redis from the hot path of every single shorten request.
### 2. BullMQ bottlenecks — what happens at 50,000 clicks/second?
Processing jobs one at a time and calling `ClickEvent.create()` per click means 50,000 individual DB round-trips — a real bottleneck.
- **Fix:** Batch the worker's writes with `ClickEvent.insertMany(batch, { ordered: false })`, accumulating events in memory for a short window (time or count threshold) before flushing. `ordered: false` lets valid documents insert even if one fails validation.
- **Extra layer:** Decouple the *real-time counter* (instant `INCR` in Redis) from *detailed analytics storage* (batched writes to MongoDB) — the user-facing number stays instant while the heavy write is decoupled.
### 3. Cron job scaling — what about a billion links?
A scheduled query for expired links needs an index to avoid a full collection scan. MongoDB has a native **TTL index**, but it hard-deletes documents — incompatible with preserving analytics via soft-delete.
- **What's actually in place:** a compound index on `{ is_active: 1, expires_at: 1 }`, so the cron query stays an efficient range scan even as the collection grows, despite not using the native TTL feature.
- **At true billion-row scale:** a Redis Sorted Set (`ZADD expiring_links <timestamp> <shortCode>`) turns "what needs to expire" into an O(log N) Redis range query, never touching MongoDB until there's something to actually expire.
### 4. Why MongoDB over PostgreSQL for fundamentally flat, structured data?
Fair challenge — the core `Url`/`User` data is exactly what a relational database is built for: strong schema validation, ACID transactions, mature indexing.
- **Reasons MongoDB was chosen anyway:** the `ClickEvent` analytics schema is semi-structured and expected to evolve (new fields without migrations); this was a deliberate opportunity for hands-on NoSQL experience; and MongoDB's sharding story pairs conceptually with the rest of the stack (stateless backend, Redis, load balancing) even though sharding itself isn't implemented.
- **Honest answer:** rebuilt today with production requirements first, PostgreSQL would likely hold `Url`/`User` (needs integrity) while MongoDB (or a time-series store) keeps `ClickEvent` (high write volume, flexible schema). Using one database for everything was a conscious simplification, not an oversight.
### 5. Rate limiting — what stops a script generating 10,000 spam links/second?
The current Redis fixed-window limiter (per user/IP) is real defense, but it's application-layer only — malicious traffic already reached the Node process and Redis before being rejected, and fixed-window allows a 2x burst right at the window boundary.
- **Fix:** An edge-layer WAF/bot-management service (e.g., Cloudflare) in front of Nginx blocks volumetric abuse before it touches the infrastructure at all, plus provides bot-detection heuristics a naive script can't easily bypass.
- **App-layer tightening:** switch fixed-window to sliding-window or token-bucket to close the boundary-burst gap, and tier limits by trust level (stricter for anonymous, looser for authenticated, with CAPTCHA as an escalation for anonymous abuse).
**The meta-point:** none of these fixes needed to be built before the questions could be answered well — what matters is correctly diagnosing the failure mode and naming the right category of solution. That's consistent with how the rest of this README treats tradeoffs: name the gap, explain the mechanism, and be honest about what's implemented versus what's the documented next step.
 
---
 
## 📜 License
 
MIT
 
---
 
## 🚀 Next Steps
 
1. ✅ **Core features built** (shortening, auth, analytics, caching, async processing)  
2. ✅ **Real-time updates** (SSE + Redis Pub/Sub, replacing polling on dashboard and analytics)  
3. ✅ **Docker containerization** (dev + production images, Docker Compose, Codespaces devcontainer)  
4. ✅ **Deployment** (MongoDB Atlas + Render + Vercel, live URLs)  
5. ⏳ **Frontend polish** (Settings page, 3D globe visualization on analytics)  
6. 🔮 **Future improvements** (admin dashboard, TypeScript, refresh tokens, batch analytics writes, segment-based ID allocation, edge-layer rate limiting)

---

## 🗓️ Backend Build Progress
 
- [x] **Day 1:** Project foundation, MongoDB schema, basic create/redirect flow
- [x] **Day 2:** Redis `INCR`-based ID generation, Base62 encode/decode, custom alias support, input validation
- [x] **Day 3:** Redis cache-aside pattern on redirects, TTL, cache invalidation on update/delete, load-tested and benchmarked
- [ ] **Day 4:** Async click analytics
- [ ] **Day 5:** User accounts (JWT auth), link expiration (TTL index)
- [ ] **Day 6:** Rate limiting, horizontal scaling test
- [ ] **Day 7:** Dockerize and deploy

---

**Built with passion for understanding systems.** 🔥  
Node.js • MongoDB • Redis • React • Three.js • Nginx
 
---

*Have questions? Read the architecture sections above or check individual file headers for detailed decision-making.*
 