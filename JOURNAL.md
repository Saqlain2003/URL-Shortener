# [DATE: 19 AUG 2026]  

## 🎯 Goal for Today:
***Create a link and get redirected. No optimization yet — just prove the flow.***

## ✅ What I Implemented / Built:
* Set up Express project structure (routes/controllers/services/models — layered, not spaghetti)
* Design MongoDB schema for URLs collection: short_code, long_url, user_id, created_at, expires_at, is_active, click_count
* Set up MongoDB Atlas (free tier) or local Mongo
* Build basic POST /api/shorten (no ID generation logic yet — just random string, get the pipe working end-to-end)
* Build GET /:shortCode redirect (straight DB lookup, no cache yet)

## 🚧 Problems & Bugs Encountered:
* No Big Problem just some error because of using packages (e.g.- nanoid) w/o installing. 😛

## 💡 Solutions & Learnings:
* **[Learned]:-** I used ***nanoid*** as today's placeholder ID generator instead of raw Math.random() string hacks — it's collision-resistant and battle-tested, but it's still temporary. Tomorrow I'll be replacing this with the Redis counter + Base62 approach, so don't get attached to it.

## 🏆 Achievements & Results:

✅ Successfully Achieved today's goal  
✅ Tested API's in Postman  
✅ Successfully creating "Short Link"                   -> Using Nanoid  
✅ Successfully redirecting using Short Link            -> Not Optimized  

## ⏭️ Next Steps (Tomorrow):
* ***Proper ID Generation & Basic Validation***
<br>
<br>
<br>

# [DATE: 20 AUG 2026] 

## 🎯 Goal for Today:
* ***Proper ID Generation by Redis INCR-Based Counter & Base62 and basic Validation***  
* ***Redis Cache-Aside pattern & Load Testing to feel the latency difference***

## ✅ What I Implemented / Built:
* Implement Redis INCR-based counter
* Write Base62 encoder/decoder
* Replace random-string generation with counter → Base62
* Handle custom alias support (user-provided short code, check uniqueness)
* Add basic validation (is it a valid URL, does alias already exist, etc.)
* Add Redis cache-aside pattern on the redirect path
* On GET /:shortCode: check Redis → miss → Mongo → populate Redis → return
* Set TTL on cache entries
* Implement cache invalidation on delete/update
* Load test it yourself — use autocannon or k6 to hit /:shortCode with and without cache, and actually watch the latency difference. This is the most important "aha" moment of the whole project.

## 🚧 Problems & Bugs Encountered:
* Faced error because of dynamic route /:shortCode catching /health route.

## 💡 Solutions & Learnings:
* **[Solution]:-** Moved health route above dynamic route app.use('/', urlRoutes); 
* **[Learned]:-** Static routes should be above dynamic route. In short, ORDER Matters.
* **[Learned]:-**
**One conceptual thing worth sitting with before you move on:** notice that ***deactivateUrl*** and ***updateUrl*** both explicitly call ***redisClient.del()***. This is the invalidation half of cache-aside, and it's the part people forget — if you only ever write to cache but never invalidate on update/delete, users could keep getting redirected to an old or deactivated URL for up to an hour (your TTL), even though the database is correct. Cache-aside isn't just "check cache, fallback to DB" — the invalidation discipline is equally part of the pattern.

* **[Learned]:-** Load Testing to route via ***AUTOCANNON***
* ### 👣 Steps

1. Install autocannon
```bash
npm install -g autocannon
```

2. Create a test URL and note its short code: 
```bash
Invoke-RestMethod -Uri "http://localhost:5000/shorten" `    
-Method Post `  
-ContentType "application/json" `  
-Body '{"longUrl": "https://example.com"}'  
```

3. Load test WITHOUT warming the cache (first hit will be a miss, rest will be cache hits since it's the same code every time — so to really see "no cache" behavior, temporarily comment out the redisClient.setEx line and the cache-check block in getOriginalUrl, run the test, then uncomment and re-test):
```bash
# First run - includes the cache miss + population + then many hits
autocannon -c 50 -d 10 http://localhost:5000/<yourShortCode>
```


## 🏆 Achievements & Results:
✅ Successfully getting short code via Redis INCR-based counter & Base62  
✅ URL & Alias are validating  
✅ **Result without Caching:**  
```text
┌─────────┬───────┬────────┬────────┬─────────┬───────────┬───────────┬─────────┐
│ Stat    │ 2.5%  │ 50%    │ 97.5%  │ 99%     │ Avg       │ Stdev     │ Max     │
├─────────┼───────┼────────┼────────┼─────────┼───────────┼───────────┼─────────┤
│ Latency │ 45 ms │ 278 ms │ 957 ms │ 1043 ms │ 452.35 ms │ 400.24 ms │ 1983 ms │
└─────────┴───────┴────────┴────────┴─────────┴───────────┴───────────┴─────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬───────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg   │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┼─────────┤
│ Req/Sec   │ 82      │ 82      │ 103     │ 111     │ 101.4 │ 8.19    │ 82      │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┼─────────┤
│ Bytes/Sec │ 22.6 kB │ 22.6 kB │ 28.4 kB │ 30.6 kB │ 28 kB │ 2.26 kB │ 22.6 kB │
└───────────┴─────────┴─────────┴─────────┴─────────┴───────┴─────────┴─────────┘  
  
Req/Bytes counts sampled once per second.
# of samples: 10

0 2xx responses, 1014 non 2xx responses
1k requests in 10.12s, 280 kB read
```
✅ **Result with Caching:** 
```text
┌─────────┬──────┬──────┬───────┬───────┬─────────┬─────────┬────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg     │ Stdev   │ Max    │
├─────────┼──────┼──────┼───────┼───────┼─────────┼─────────┼────────┤
│ Latency │ 3 ms │ 4 ms │ 7 ms  │ 10 ms │ 4.42 ms │ 9.24 ms │ 656 ms │
└─────────┴──────┴──────┴───────┴───────┴─────────┴─────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬────────┬──────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%  │ Avg      │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼────────┼──────────┼──────────┼─────────┤
│ Req/Sec   │ 5,003   │ 5,003   │ 11,023  │ 11,943 │ 10,068.6 │ 2,034.49 │ 5,000   │
├───────────┼─────────┼─────────┼─────────┼────────┼──────────┼──────────┼─────────┤
│ Bytes/Sec │ 1.38 MB │ 1.38 MB │ 3.04 MB │ 3.3 MB │ 2.78 MB  │ 562 kB   │ 1.38 MB │
└───────────┴─────────┴─────────┴─────────┴────────┴──────────┴──────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 10

0 2xx responses, 100675 non 2xx responses
101k requests in 10.05s, 27.8 MB read
```

✅ **Summary Caparison:**
```text
┌─────────────────────┬───────────┬─────────┬───────────────────────────┐
│    Metric	          │ No Cache  │	Cached	│  Improvement              │
├─────────────────────┼───────────┼─────────┼───────────────────────────┤
│Avg latency          │452.35 ms  │4.42 ms	│~102x faster               │
├─────────────────────┼───────────┼─────────┼───────────────────────────┤
│Median (50%)         │278 ms	  │4 ms	    │~70x faster                │
├─────────────────────┼───────────┼─────────┼───────────────────────────┤
│p99 latency	      │1043 ms	  │10 ms	│~104x faster               │
├─────────────────────┼───────────┼─────────┼───────────────────────────┤
│Req/sec (avg)	      │101.4	  │10,068.6	│~99x more throughput       │
├─────────────────────┼───────────┼─────────┼───────────────────────────┤
│Total requests in 10s│1,014	  │101,000	│~100x more traffic handled │
└─────────────────────┴───────────┴─────────┴───────────────────────────┘
``` 
**Why is the improvement almost exactly ~100x?** That's not a coincidence — it's telling you that in the no-cache version, essentially 100% of your request latency was the MongoDB round trip (query time + connection pool wait). Once that's removed from the critical path, what's left is just Redis lookup + Node's own overhead, which is nearly free by comparison. This is the real lesson: it's rarely the "logic" that's slow in these systems, it's the I/O.

**That 656ms Max in your cached run — is that a problem?** No, and it's worth knowing why not. That's very likely the very first request in the test, before autocannon's concurrent connections had all ramped up, or possibly the initial TCP/Redis connection warmup. One outlier out of 101,000 requests, sitting at 656ms while your 99th percentile is 10ms, is noise, not a pattern. If you saw many requests near 656ms, that would be a real problem worth investigating — a single one isn't.

**Why did req/sec increase, not just latency decrease?** These are actually the same phenomenon viewed from two angles. Each request now finishes so much faster that your server can start serving the next request in the queue almost immediately, so far more requests complete within the same 10-second window. Low latency directly is high throughput at a fixed concurrency level.
<br>
<br>
<br>

# [DATE: 21 AUG 2026] 

## 🎯 Goal for Today:
* ***Implement Analytics without blocking a hot path with logging/analytics writes.***
* ***Implement Auth & User Account.***

## ✅ What I Implemented / Built:
* Add a click-events collection in Mongo
* Make the redirect endpoint fire-and-forget the analytics write (don't await it in the critical path — or push to a lightweight queue like BullMQ + Redis if you want to go further)
* Capture: timestamp, short_code, referrer, user-agent, rough geo from IP
* Build GET /api/analytics/:shortCode endpoint to aggregate this data
* Implemented ***Cache Penetration Fix***
* Add JWT-based auth (signup/login)
* Tie URLs to `user_id`
* Add "my links" dashboard endpoint
* Add expiration handling (a cron job(Soft Delete/Deactivate) or TTL index in Mongo(Hard Delete) to auto-deactivate expired links)

## 🚧 Problems & Bugs Encountered:
* **[Problem 1]:-** Showing empty count for non-existing URL instead of ***404 - Not Found***
* **[Problem 2]:-** Non Existing URL searches cache and get miss, then searches DB and return 404. If 10000 simultaneously non existing URL is send, DB will crashed. ***[Cache Penetration]***
* **[Problem 3]:-** Implementing MongoDB TTL Index will permanently delete the deactivated URL which changes the motive of keeping track of URL before deactivation

## 💡 Solutions & Learnings:
* **[Solution 1]:-** Check DB if URL exist if not return ***404 - Not Found***
* **[Solution 2]:-** By Storing ***Negative TTL*** and ***Sentinel String(__NULL__)*** in cache for short duration (e.g. 60seconds) for non-existing visited URL
* **[Understand];-** A few things worth understanding, not just pasting:

1. **Why a sentinel string (__NULL__) and not just caching an empty string ""?** Because redisClient.get() returning an empty string vs returning null (key doesn't exist at all) can be easy to confuse in a conditional check. A distinct, unmistakable sentinel value removes any ambiguity about what's actually being represented — "we checked, and it doesn't exist" is a real piece of information, distinct from "not in cache at all."  

2. **Why the negative TTL (60s) is much shorter than the positive TTL (3600s):** this is the important tradeoff to actually understand. If someone requests a code that doesn't exist yet, you cache "not found" for 60 seconds. If that exact code gets created 10 seconds later (rare, but possible — e.g., someone typo's a link, then the real owner creates that alias moments later), your negative cache would incorrectly keep saying "not found" for up to 60 more seconds. A full hour would make that problem much worse. 60 seconds is a reasonable balance: long enough to actually stop a penetration attack/repeated-miss pattern, short enough that a legitimate new URL doesn't stay invisible for long.

3. **Why createShortUrl now calls redisClient.del() on the new code:** this directly closes the edge case from point 2. The moment a URL is actually created, we proactively clear any stale negative cache entry for that exact code — so even within that 60-second window, a legitimate creation immediately becomes visible rather than waiting out the TTL.

* **[Solution 3]:-** Use Alternative CRON which will allow to do soft deactivate and we can keep the record of deactivated URLs.

* **[Learned]:-** 
1. **Why bcryptjs and not bcrypt:** bcrypt requires native compilation (node-gyp), which can be a pain on Windows specifically. bcryptjs is a pure-JS implementation, slightly slower, but zero compilation headaches. Worth knowing this tradeoff exists.

2. **Why two versions of protect middleware instead of one:** your /shorten endpoint needs to support both logged-in users (tie the link to their account) and anonymous users (like it's worked all along). ***protect*** would incorrectly block anonymous users entirely. ***optionalAuth*** lets both cases through, but still populates req.user when a valid token is present. Routes like "my links" that make no sense without a logged-in user use protect instead.

3. **Expiration Handling**

    Here's something worth stopping on before I hand you code: MongoDB's TTL index only supports auto-deleting a document — it cannot set a field like is_active: false for you. That directly conflicts with the soft-delete philosophy we committed to on Day 4 (keep records for analytics/audit history, never hard-delete). So we have a real design decision here, not just an implementation detail.

    ***Two legitimate options:***

    * **Mongo TTL index** — simplest, but hard-deletes the document the moment it expires. You'd lose analytics history for that link forever.
    * **A scheduled cron job** — checks for expired links periodically and soft-deactivates them (is_active: false), consistent with everything we've built so far, and it can also properly invalidate the Redis cache at the same time (a raw TTL index has no way to touch your Redis cache — it operates entirely inside MongoDB, silently, with no hook into your app code).

    I'm going with the ***cron job approach*** — it's consistent with your existing soft-delete + cache-invalidation pattern, and it teaches you a genuinely useful pattern (scheduled background jobs) that TTL indexes don't.

    ```bash
        npm install node-cron
    ```

## 🧪 Test in Postman (Cache Penetration):
1. **Test 1 — Confirm penetration protection works**  
* **GET** http://localhost:5000/thisdoesnotexist123
* **Expected:** 404
* **Immediately repeat the same request: GET** http://localhost:5000/thisdoesnotexist123
* **Expected:** 404 again — but this time, add a quick console.log temporarily in getOriginalUrl right after the sentinel check to confirm Mongo was not queried the second time. Or just trust the logic and verify via Redis directly:  

    ```bash
        redis-cli
        GET shorturl:thisdoesnotexist123
    ```
    Should return "__NULL__".

2. **Test 2 — Confirm the TTL is actually short**

    ```bash
        redis-cli
        TTL shorturl:thisdoesnotexist123
    ```
    Should show a number ≤ 60 (seconds remaining), not close to 3600.

3. **Test 3 — Confirm creating that exact code clears the negative cache**
* **POST /shorten** with { "longUrl": "https://example.com", "customAlias": "thisdoesnotexist123" }
* **Then GET** http://localhost:5000/thisdoesnotexist123
* **Expected:** this should now redirect successfully, not 404 — proving the negative cache was correctly invalidated on creation, even though the 60s TTL hadn't expired yet

## 🧪 Test in Postman(User Auth & Cron):

1. **POST** /api/auth/signup with { "email": "test@test.com", "password": "password123" } → expect 201 with a token
2. **POST** /api/auth/login with same credentials → expect 201... wait, 200, with token
3. **POST** /api/auth/login with wrong password → expect 401, generic "Invalid credentials"
4. **POST** /shorten without an Authorization header → should still work anonymously (confirms optionalAuth doesn't block)
5. **POST** /shorten with Authorization: Bearer **\<token>** from step 1 → create a link, then check MongoDB directly — user_id should be populated
6. **GET** /api/urls/my without a token → expect 401
7. **GET** /api/urls/my with a valid token → expect the array containing the link from step 5
8. **POST** /shorten with { "longUrl": "https://example.com", "expiresAt": "2020-01-01" } (a past date) → expect 400
9. **POST** /shorten with a near-future expiresAt (e.g., 2 minutes from now) → create it, then wait ~5-6 minutes for the cron job to run, then check that link's is_active in MongoDB — should have flipped to false automatically, and its Redis cache key should be gone  
*  **👣 Steps for Point 9:**  
    Postman request:

* POST http://localhost:5000/shorten
* Body:  
    ```json
        {
        "longUrl": "https://example.com",
        "expiresAt": "2026-08-21T10:05:00.000Z"
        }
    ```
    **Important formatting note: use full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)** — this is what JavaScript's new Date() parses reliably. The trailing Z means UTC. If your local time is ahead/behind UTC (check your system timezone), account for that offset, or simplify by just asking Node to tell you the current time first:

* Run this in your terminal to get an ISO string exactly 2 minutes from now, no manual math:
    ```bash
        node -e "console.log(new Date(Date.now() + 2*60*1000).toISOString())"
    ```
    Copy that output directly into expiresAt in your Postman body.

* **Note the shortCode from the response**

    Say it comes back as "shortCode": "k".

* **Hit the redirect once:** 
    ```text 
        curl http://localhost:5000/j
    ```
    (or visit in browser/Postman with auto-redirect off) — this populates the cache

* **Confirm it's cached and active right now**
    ```bash
        redis-cli
        GET shorturl:k
    ```
* Should return the long URL (assuming you've hit the redirect once to populate cache) — or check Mongo directly to confirm is_active: true and expires_at is set correctly.

* Wait for the cron job to run

    Your cron job runs every 5 minutes (*/5 * * * *), on the clock — meaning it fires at :00, :05, :10, :15, etc., not 5 minutes after your server started. So depending on when you created the link, you might wait anywhere from a few seconds up to 5 minutes for the next scheduled run.

    Watch your server terminal — when the job runs and finds your expired link, you should see:
    ```text
        Expired 1 link(s)
    ```
* **After that log appears, check Redis again**
    ```bash
        redis-cli
        GET shorturl:k
    ```
    Expected: (nil) — confirms the cron job's redisClient.del() call correctly evicted it.

* Confirm in MongoDB directly

    Check the urls collection for that document (via Compass, Atlas UI, or mongosh):
    ```javascript
        db.urls.findOne({ short_code: "k" })
    ```
    Expected: is_active: false now, even though you never called the DELETE endpoint yourself.

* Confirm the redirect now correctly 404s  
    Expected: 404 { "error": "URL not found" } — proving the whole chain worked: expiry time passed → cron caught it → flipped is_active → cleared cache → redirect logic correctly rejects it.
## 🏆 Achievements & Results:
✅ Successfully tested analytics route.  
✅ Implemented Cache Penetration Fix.  
✅ Full CRUD is User-based.  
✅ Expiration is working automatically.  
✅ Succesfully tested all User-based route and cron automated expiration handling.  
<br>
<br>
<br>

# [DATE: 24 AUG 2026] 

## 🎯 Goal for Today:
* ***Add Rate Limiter & Simulate Horizontal Scaling***
* ***Generate QR Code for better visuals***

## ✅ What I Implemented / Built:
* Add rate limiting (per-IP or per-user) using Redis
* Simulate horizontal scaling locally: run 2 Node instances behind a simple load balancer (Nginx or even just two ports + a basic round-robin proxy) to feel what "stateless service" means
* Add basic health-check endpoint for readiness/liveness
* QR Code generation on Demand

## 🚧 Problems & Bugs Encountered:
* **[Problem 1]:-** Nginx redirecting all request to Server 2 (i.e. PORT 5001) only

## 💡 Solutions & Learnings:
* **[Solution]:-** I am using servers on PORT 5000 and 5001 but in ***nginx.conf***, I have written server PORT 50001 and sever 5002
* **[Learned 1]:-**   
   * **This is the fixed-window algorithm — understand its real tradeoff, not just that it "works":** it resets the count entirely every 60 seconds, which means a user could send 20 requests at :00:59 and another 20 at :01:01 — 40 requests in 2 seconds, right at the window boundary. The more accurate approach is a ***sliding window*** log using Redis sorted sets (store a timestamp per request, count how many fall within the last 60 seconds on every check). Fixed-window is what most real systems actually use anyway, because it's cheap (one key, one INCR) versus the extra memory/computation of sorted sets — the boundary-burst edge case is usually an acceptable tradeoff. Good to know both exist and why teams pick the cheaper one.

   * **Also notice catch calls next() instead of blocking** — this is called "failing open." If Redis itself goes down, you have a choice: block all traffic (fail closed, "safe" but takes your whole app down when Redis has a hiccup) or let traffic through unlimited temporarily (fail open, "available" but briefly unprotected). For a rate limiter specifically, most production systems fail open — losing rate-limiting protection for a few seconds during a Redis blip is a much smaller problem than your entire API going down because of it.

* **[Learned 2]:-** Health Checks (liveness vs readiness — real standard, not just "one /health route")

    This distinction matters in real orchestrated systems (Kubernetes, load balancers): liveness asks "is the process alive at all?" — if this fails, the process should be restarted. Readiness asks "is this instance actually able to serve traffic right now?" — if this fails, a load balancer should stop sending it requests, but not necessarily restart it (e.g., it's still booting, or its DB connection just dropped temporarily).

* **[Learned 3]:-** 
    * **Important — both instances share the same MongoDB and Redis.** This is the actual point: the data layer is shared and centralized, but the application layer (Node processes) are now duplicated and independent. This is exactly what ***"stateless service"*** means in practice — neither Node instance holds any unique state in memory; all real state (URLs, cache, rate-limit counters) lives in shared external stores. That's precisely why you can run 2, 20, or 200 identical copies and it just works.

    *  **👣 Steps for Enabling 2 nodes:**  
    1. Start server in 1st Terminal using:  

        ```bash
            npm run dev
        ```
    2. Leave the first one running, open new terminal:

        ```bash
            PORT=5001 npx nodemon server.js
        ```
* **[Learned 4]:-** Nginx Load Balancer
    *  **👣 Steps for Setup Nginx**

    1. **Download and Extract:**  
    * Open your browser and go to the official website: nginx.org/en/download.html.
    * Look under the Mainline version or Stable version section.
    * Click the nginx/Windows-x.xx.x link to download the .zip file.
    * Extract the .zip file to a folder of your choice (e.g., C:\nginx).

    2. **Configure for Your 2 Node Instances:**  
    Before running Nginx, you need to tell it to split traffic between your two Node.js processes (Port 5000 and Port 5001).
    * Open the extracted folder and navigate to the conf directory.
    * Open the nginx.conf file in a text editor (like Notepad or VS Code).
    * Replace the contents of the file with this basic load-balancing configuration:
    ```text 
            events {
            worker_connections 1024;
            }

            http {
                upstream url_shortener_backend {
                    server localhost:5000;
                    server localhost:5001;
                }

                server {
                    listen 8080;

                    location / {
                        proxy_pass http://url_shortener_backend;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    }
                }
            }
    ```

    * Save and close file

    3. **Run Nginx:**
    * Open Command Prompt (cmd) as an Administrator.
    * Navigate to your Nginx folder:

        ```cmd
            cd C:\nginx
        ```
    * Start Nginx by running:

        ```cmd
            start nginx
        ```
        (Note: A command window might flash quickly and disappear. This is normal; Nginx runs quietly in the background).
    
    🛑 **Managing the Nginx Process**  
        Because Nginx runs in the background, you control it using these specific commands from inside your C:\nginx folder:
    * Check if it is running: Open your browser and go to http://localhost. If it works, Nginx is successfully forwarding to your Node app.
    * Stop Nginx immediately: nginx -s stop
    * Graceful shutdown: nginx -s quit
    * Reload configuration (after making changes to nginx.conf): nginx -s reload

    **Why proxy_set_header X-Real-IP and X-Forwarded-For matter here specifically:** remember your rate limiter uses req.ip. Without these headers, every request arriving at your Node instances would show Nginx's own IP (127.0.0.1) as the source — meaning your rate limiter would treat all users as one single IP and rate-limit everyone together incorrectly. With trust proxy: true already set in your app.js from Day 5, Express will correctly read the real client IP from these forwarded headers instead.

* **[Decision]:-** Design decision first

    **Where should the QR code live — generated on-demand at request time, or generated once and cached?** Generate on-demand, don't store it. A QR code is just a deterministic visual encoding of the short URL string — there's nothing to compute expensively or cache, and storing a QR image file per URL would be unnecessary storage overhead for something regenerable in milliseconds from data you already have.

    ```bash
        npm install qrcode
    ```
* **[Learned 5]:-** 
    * **Why toDataURL and not saving a .png file to disk:** a Data URL (data:image/png;base64,...) can be sent directly in a JSON API response and rendered straight into an \<img src=""> tag on the frontend with zero extra requests, zero file storage, zero cleanup needed. Writing to disk would mean managing a filesystem of images, serving them as static files, and cleaning them up when URLs get deleted — real complexity for something that takes a few milliseconds to regenerate on demand.

    * **Why errorCorrectionLevel: 'M':** QR codes support 4 levels of error correction (L, M, Q, H) — a tradeoff between how much damage/obstruction the code can survive versus how dense/complex the pattern becomes. M (~15% recovery) is the standard middle ground used by most real products — good enough to survive a bit of screen glare or minor print smudging, without generating an unnecessarily dense pattern the way H would.

    * **Why check existence first instead of just generating a QR for any code:** without this check, someone could request a QR code for a short code that was never created, and you'd hand back a perfectly valid-looking QR code that leads nowhere. Small thing, but it's the difference between an API that validates its inputs and one that doesn't.

    📊 **The 4 Error Correction Levels**  
    There are four standardized levels. Choosing a higher level makes the QR code more durable but adds more modules (blocks), making the pattern denser.  
    
    ### 📊 QR Code Error Correction Levels

    | Level | Error Recovery Capacity | Density | Best Use Case |
    | :---: | :---------------------: | :-----: | :------------ |
    | **L** | Recovers up to **7%**   | Low     | Digital screens and clean print layouts |
    | **M** | Recovers up to **15%**  | Medium  | Standard marketing, flyers, and receipts *(Default)* |
    | **Q** | Recovers up to **25%**  | High    | Surfaces prone to smudging, bending, or weather |
    | **H** | Recovers up to **30%**  | Maximum | Custom designs with an embedded logo in the center |


## 🧪 Test in Postman (Rate Limiting):
* Hit **GET** /shorten 21+ times quickly (Postman Runner, or just spam-click Send) — the 21st should return 429.

## 🧪 Test in Postman (Health Check)
* **GET** /health/live → always 200 if server's up. 
* **GET** /health/ready → 200 normally; 
* Stop your Redis server and hit it again → should flip to 503 with redis: false.  
This is exactly what an Nginx/load balancer would check before deciding whether to route traffic to an instance.

## 🧪 Test in Postman (Nginx Round-Robin Distribution):
Hit http://localhost:8080/health/live repeatedly (Postman, spam Send, or a quick loop) — you should see the port field alternate between 5000 and 5001. That alternation is Nginx round-robining your requests across two independent, identical processes — this is horizontal scaling, made visible.

## 🧪 Test in Postman (QR Generation and Download):
**Test 1 — Get QR as JSON/base64**

* GET http://localhost:5000/api/qr/<yourShortCode>
* Expected: 200 with { "shortCode": "...", "qrCode": "data:image/png;base64,..." }
* To actually see it: copy the full qrCode value, paste it into your browser's address bar, hit enter — it should render as an image

**Test 2 — Get QR for non-existent code**

* GET http://localhost:5000/api/qr/doesnotexist
* Expected: 404

**Test 3 — Download as direct PNG**

* GET http://localhost:5000/api/qr/<yourShortCode>/download
* In Postman, don't click "Send" normally — click the dropdown arrow next to Send and choose "Send and Download", or just paste the URL directly into a browser tab
* Expected: an actual QR code image renders/downloads
* Scan it with your phone — this is the real end-to-end test — it should open your short URL and redirect correctly

## 🏆 Achievements & Results:
✅ Understand what "stateless" buys and why it's a prerequisite for horizontal scaling  
✅ Successfully simulated Horizontal scaling  
✅ Used Nginx as Load Balancer  
✅ Implemented QR Generation & Download