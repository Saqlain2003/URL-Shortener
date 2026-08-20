# [URL Shortener]

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A high-level-design-first URL shortener built to actually feel the concepts — caching, ID generation, and read-heavy scaling — instead of just reading about them.

## 📖 Description

This project is a full-scale URL shortener built as a hands-on implementation of System Design / HLD concepts. Rather than a simple CRUD app, it's built with the same considerations a large-scale system would need: fast redirects under load, collision-free ID generation, cache-aside architecture, and non-blocking analytics.
 
It exists as a learning project to bridge the gap between studying System Design theory and actually building a system that faces real bottlenecks — like what happens when reads outnumber writes 100:1, or why you can't block a redirect with a database write. It's built for developers (like myself) who know the theory and want to implement it end-to-end, from a bare Express server to a deployed, cached, horizontally-scalable service.

## ✨ Features
* **Short URL generation:** Converts any long URL into a compact, unique short code using a Redis-backed counter encoded in Base62 — no collision checks needed.
* **Custom aliases:** Users can request their own custom short code instead of an auto-generated one, with format and uniqueness validation.
* **Fast redirects (cache-aside):** Redis sits in front of MongoDB on the redirect path — cache hit returns instantly, cache miss falls back to the DB and populates the cache for next time.
* **Input validation:** Long URLs are validated as well-formed http/https URLs; custom aliases are validated for length and allowed characters.
* **Update & deactivate:** URLs can be updated or soft-deleted, with cache invalidation wired in so stale entries never linger past a write.
* **Async click analytics:** *(planned — Day 4)* Click events captured without blocking the redirect path.
* **Link expiration:** *(planned — Day 5)* Auto-expiring URLs via MongoDB TTL index.
* **User accounts:** *(planned — Day 5)* JWT-based auth for managing personal links.
* **Rate limiting:** *(planned — Day 6)* Redis-backed rate limiting.
* **Horizontal scaling ready:** *(planned — Day 6)* Stateless service tested behind a load balancer with multiple instances.
> **Project status:** Day 3 of a 7-day build complete. Core create/redirect flow, Redis-based ID generation, and cache-aside caching (with measured performance gains, see below) are all working. Analytics, auth, expiration, and deployment are still in progress.

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

## 🗂️ Project Structure

```text
📦 url-shortener/
├── 📂 src/
│   ├── 📂 config/
│   │   ├── 💻 db.js              → Mongo connection setup
│   │   └── 💻 redis.js           → Redis client setup
│   ├── 📂 models/
│   │   ├── 💻 Url.js              → Mongoose schema for URLs
│   │   ├── 💻 User.js             → (Day 5)
│   │   └── 💻 ClickEvent.js       → (Day 4)
│   ├── 📂 controllers/
│   │   └── 💻 url.controller.js   → handles req/res, calls services
│   ├── 📂 services/
│   │   └── 💻 url.service.js      → business logic (create, lookup, etc.)
│   ├── 📂 routes/
│   │   └── 💻 url.routes.js       → maps endpoints to controllers
│   ├── 📂 middlewares/
│   │   └── 💻 errorHandler.js
│   ├── 📂 utils/
│   │   └── 💻 validators.js       → URL validation helpers
│   └── 💻 app.js                  → Express app setup
├── 💻 server.js                   → entry point, starts the server
├── ⚙️ .env
├── 📝 JOURNAL.md
├── 📝 README.md
└── ⚙️ package.json
```

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

## 📡 API Overview
 
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/shorten` | Create a new short URL (accepts optional `customAlias`) |
| `GET` | `/:shortCode` | Redirect to the original long URL (cache-aside: Redis → MongoDB fallback) |
| `PUT` | `/urls/:shortCode` | Update the long URL for an existing short code (invalidates cache) |
| `DELETE` | `/urls/:shortCode` | Deactivate a short URL (soft delete, invalidates cache) |
| `GET` | `/api/analytics/:shortCode` | Get click analytics for a short URL *(planned)* |

## 🏗️ Tech Stack
 
* **Backend:** Node.js, Express (ESM)
* **Database:** MongoDB (Mongoose)
* **Cache / ID Generation:** Redis — atomic `INCR` counter for ID generation, cache-aside pattern for redirects
* **ID Encoding:** Custom Base62 encoder/decoder
* **Auth:** JWT *(planned)*
* **Load Testing:** autocannon

## 🗓️ Build Progress
 
- [x] **Day 1:** Project foundation, MongoDB schema, basic create/redirect flow
- [x] **Day 2:** Redis `INCR`-based ID generation, Base62 encode/decode, custom alias support, input validation
- [x] **Day 3:** Redis cache-aside pattern on redirects, TTL, cache invalidation on update/delete, load-tested and benchmarked
- [ ] **Day 4:** Async click analytics
- [ ] **Day 5:** User accounts (JWT auth), link expiration (TTL index)
- [ ] **Day 6:** Rate limiting, horizontal scaling test
- [ ] **Day 7:** Dockerize and deploy

## 📄 License
 
This project is open for learning purposes. Feel free to fork and build on it.