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
<br>
<br>
<br>

# [DATE: 25 AUG 2026] 

## 🎯 Goal for Today:
* ***Integrating Automated tests & CI workflows***

## ✅ What I Implemented / Built:
* Implements Unit Tests & Integration Tests via ***Vitest*** Testing Framework
* Use a separate test MongoDB database (spun up fresh for each test run, e.g., via mongodb-memory-server which runs an in-memory Mongo instance just for tests — no real DB needed, fast, isolated)
* Wire them into GitHub Actions so they run automatically on every push via CI workflows

## 🚧 Problems & Bugs Encountered:
* **[Decision Problem 1]:- Which database to choose for testing?**  
    **Details:- The core problem tests create:** tests need to create, modify, and delete data to verify your code works — but you don't want that happening in the same database that holds your real (or real-feeling) development data. Imagine running your test suite and it deletes the URL you were manually testing in Postman five minutes ago, or worse, if this were production, actually deletes real user data. Tests need their own separate, disposable database.

* **[Decision Problem 2]:-** **What about Redis in tests?**  
    **Details:- Similar problem, similar solution needed. We have two choices:** mock Redis calls entirely (fake the responses in test code, no real Redis needed) or run a real lightweight Redis in CI too. 

* **[Problem 3]:-** Redirect controller calls ***recordClick(...)*** without *await*, deliberately (that's the whole fire-and-forget point from Day 4). But that creates a genuine testing problem: if a test hits the redirect, then immediately checks the analytics endpoint, the background write might not have finished yet — causing the test to fail unpredictably, not because your code is wrong, but because the test checked too early. This is a real, common category of test flakiness worth knowing by name: ***a race condition*** in the test itself.

* **[Problem 4]:-** Testing [cron.schedule('*/5 * * * *', callback)] directly would mean either **waiting 5 real minutes** in your test suite (unacceptable) or reaching into cron internals to fake time (fragile, overly complex for what we're trying to prove).

* **[Bug 1]:-** **Duplicate alias test: expected 201 to be 409**

    This one's a **genuine race condition** in test setup, not a bug in your app code. Here's what's actually happening: Mongoose builds indexes (like the unique index on short_code) asynchronously, in the background, after you connect. In your real dev environment, this has always had plenty of time to finish before you ever hit the API — you connect, wait, then start testing manually in Postman. But in the test suite, we connect and immediately start firing requests, so the very first "duplicate alias" test can race ahead of index creation — meaning MongoDB hasn't actually started enforcing uniqueness yet when the second insert happens, so it succeeds when it should have failed.

## 💡 Solutions & Learnings:
* **[2 Options]:-**  
    **Option A — A separate real MongoDB database**

    * You'd point your test config at, say, mongodb://localhost:27017/urlshortener_test instead of urlshortener. Still a real, persistent MongoDB — just a different database name so it doesn't collide with your dev data.

    * **Pros:** Simple to understand, behaves identically to production Mongo, no new tooling  

    * **Cons:** You have to remember to clean it up between test runs (delete all documents before/after each test, or you'll get false failures from leftover data), it's slower (real disk I/O), and if you ever run tests on a different machine (like CI, which we're doing next), that machine needs its own MongoDB installed and running  

    **Option B — mongodb-memory-server (in-memory, temporary)**

    * This spins up a real MongoDB binary, but running entirely in RAM, fresh and empty, only for the duration of your test run — then it's destroyed completely when tests finish. No files touched on disk, no real server needed running beforehand.

    * **Pros:** Every test run starts from a guaranteed-clean, empty database — no leftover data ever causes a false pass/fail. Much faster (RAM, not disk). Critically: this is what makes CI possible without extra setup — GitHub Actions doesn't have your local MongoDB installed, but this package downloads and runs its own temporary Mongo binary automatically, so tests work identically on your machine and in CI with zero extra configuration  

    * **Cons:** Slightly more setup complexity upfront (a test setup/teardown file), and the very first time it runs, it downloads a MongoDB binary (~100MB), which takes a few extra seconds once

* **[My Choice]:-** **Option B** ***(mongodb-memory-server)***

* **[Reason 1]:-** **Option A** would require us to also configure a MongoDB service inside your GitHub Actions workflow — extra YAML, another moving part to get wrong. **Option B** sidesteps that complexity entirely and is genuinely the more common real-world choice for exactly this reason.

* **[My Choice & Reason 2]:-** Given my code calls Redis in several places (caching, rate limiting, ID generation), I'd lean toward *mocking Redis* for unit/integration tests rather than spinning up a real instance — *it keeps tests fast and avoids a second piece of test infrastructure*. I'll show exactly how when we get to the integration tests.

* **[Learned 1]:-** 
    ```bash
        npm install -D vitest supertest mongodb-memory-server
    ```
    **What each does:** **vitest** is the test runner itself. **supertest** lets you make fake HTTP requests directly against your Express app in tests, without actually starting a server on a port. **mongodb-memory-server** gives you the disposable in-memory MongoDB we just discussed.

* **[Learned 2]:-** 
    * **Notice something important about the javascript:** and file:// test I just added: go back and check your actual isValidUrl function. Does it actually reject those? If you followed the earlier implementation exactly, it should — we checked parsed.protocol === 'http:' || parsed.protocol === 'https:' — but this is a great example of why tests matter: this test would have caught the open-redirect vulnerability from security gaps list if that validation had been missing or broken. That's the real value of tests — not proving code works, but catching when it silently stops working.

    * Node's built-in URL class parses any string with a protocol scheme, including non-http ones:

        ```javascript
            new URL('javascript:alert(1)').protocol // → 'javascript:'
            new URL('file:///etc/passwd').protocol  // → 'file:'    
        ```

        Since your check is parsed.protocol === 'http:' || parsed.protocol === 'https:', both of those evaluate to false and get rejected. The URL constructor doesn't throw on these — it happily parses them — so the protocol check specifically is the thing doing the rejecting, not a parse failure. That's exactly why the test is meaningful: if someone later "simplified" this function and accidentally dropped the protocol check (kept only try { new URL(x) } catch { return false }), the test would fail immediately and loudly, whereas the bug itself would be silent and easy to miss in a code review.

* **[Learned 3]:- ** **Why afterEach clears data but afterAll tears down the whole server:** each individual test should start from a clean slate (no leftover documents from the previous test silently causing a false pass or fail), but you don't want to pay the cost of spinning up/tearing down the entire in-memory Mongo server for every single test — that would be slow. One server for the whole file, wiped clean between tests.

* **[Learned 4]:-** 
    * **Why vi.mock('../config/redis.js', ...) with a fake in-memory Map:** rather than connecting to a real Redis, we're substituting your actual Redis client with a fake object that mimics its interface (get, setEx, del, incr) but stores everything in a plain JavaScript Map in memory. Your service code has no idea it's talking to a fake — it calls redisClient.get(...) exactly the same way either way. This is the core idea of mocking: replace a real dependency with a fake that behaves the same way for the purposes of this test, so you can test your logic in isolation from Redis's correctness (which isn't what you're trying to verify here).

    * **Why the dynamic await import('../app.js') instead of a normal top-level import:** this is a subtle but important ordering issue. Your app.js imports routes, which import controllers, which import services, which import redis.js directly at the top of the file. If we used a normal import app from '../app.js' at the top of this test file, JavaScript would resolve that import chain before vi.mock has a chance to intercept it, and your real Redis client would get imported instead of the mock. The dynamic await import(...) after vi.mock(...) guarantees the mock is registered first.

* **[Learned 5]:-** 
    * **Unit Testing:-** Unit testing is a software development practice where the smallest testable parts of an application, called units (such as functions, methods, or classes), are checked individually and in isolation to ensure they work correctly.
    
    * **How Unit Testing Works: The AAA Pattern:-** Developers structure most unit tests using the Arrange, Act, Assert (AAA) pattern to keep tests clean and readable:
        * Arrange: Set up the test conditions and inputs.
        * Act: Execute the specific function or code block being tested.
        * Assert: Verify if the actual output matches the expected result

    * **Mocks:-** A mock is a fake object used in software testing to simulate the behavior of real, complex dependencies.When you write a unit test, your code must be isolated.  
        * If the code you are testing relies on an external system—like a database, an external API, or the computer's file system—you replace that system with a mock. The mock mimics the real object by returning predetermined data, allowing you to test your code without making actual network or database calls.

        * 🎭 **Real-World Analogy** Think of a mock like a crash test dummy used by car manufacturers.To test if an airbag deploys correctly, engineers don't put a real human in the driver's seat. Instead, they use a dummy that mimics a human's weight and shape. The dummy provides the necessary environment for the test without the risk, cost, or complexity of using a real person.
    
    * **When to use Unit Testing and Integration Testing**  
    *The actual decision rule for unit vs. integration*

        Here's the concrete rule, not just examples:

        **Ask:** does this function touch anything outside itself — a database, a cache, the filesystem, the network, the system clock, randomness?

        * **No →** unit test. Fast, no setup, tests pure logic.  
        * **Yes →** integration test (or you'd have to mock every single dependency, which usually isn't worth it once there's more than one).

        Applying it to your actual codebase:

        

        | Component / Function | External State? | Dependencies / Description | Test Type |
        | :--- | :---: | :--- | :--- |
        | **encodeBase62 / decodeBase62** | **No** | Pure algorithmic logic | Unit |
        | **isValidUrl / isValidAlias** | **No** | Validation rules only | Unit |
        | **createShortUrl** | **Yes** | MongoDB write, Redis cache | Integration |
        | **getOriginalUrl** | **Yes** | MongoDB read, Redis cache | Integration |
        | **hashPassword / comparePassword** | **No** | Pure crypto function *(Pending)* | Unit |
        | **generateToken / verifyToken** | **No** | Touches `process.env` only *(Pending)* | Unit |
        | **recordClick** (analytics) | **Yes** | MongoDB write, GeoIP lookup | Integration |
        | **Full POST `/shorten` flow** | **Yes** | Express HTTP request/response | Integration |
        | **Expiration cron job** | **Yes** | MongoDB query, Redis delete *(Time-based)* | Integration |
    
* **[Learned 6]:-** **Types of Testings**  
    🧱 **1. The Core Functional Levels (The Testing Pyramid)**    
    These tests verify what the system does, ensuring the software meets business requirements. They are typically structured from the narrowest code level to the entire user experience.  
    
    * **Unit Testing:** Validates the smallest testable components (methods or classes) in complete isolation.
    * **Integration Testing:** Verifies that multiple modules or units interact with each other correctly.
    * **System Testing:** Evaluates the complete, fully integrated software to ensure it satisfies requirements.
    * **Acceptance Testing:** Performed by end-users or clients to confirm if the system is ready for production.

    🛡️ **2. Non-Functional Testing**  
    These tests verify how the system performs, focusing on operational attributes rather than specific business logic.
    
    * **Performance Testing:** Checks system responsiveness, scalability, and stability under a specific workload.
    * **Load Testing:** Measures how the application behaves under expected real-life heavy usage.* **Stress Testing:** Pushes the software beyond its limits to see where and how it breaks.   
    * **Security Testing:** Identifies vulnerabilities, threats, and risks to protect application data.
    * **Usability Testing:** Evaluates how user-friendly and intuitive the application's interface is.

    🔄 **3. Change-Related Testing**  
    These types of testing occur after developers modify the existing codebase.
    
    * **Regression Testing:** Re-runs existing tests to ensure that new code changes haven't broken working features.
    * **Smoke Testing:** Runs a quick set of basic tests on a new build to check if the app is stable enough to test further.
    * **Sanity Testing:** Concentrates narrowly on validating a specific bug fix or a minor functional update.

    👁️ **4. Structural Perspective Testing**  
    These approaches define how much visibility the tester has into the underlying source code.
    
    * **Black-Box Testing:** Testing the software without any knowledge of its internal code structure or logic.
    * **White-Box Testing:** Testing with full access to the source code, internal paths, and system design.
    * **Grey-Box Testing:** A hybrid approach where the tester has partial knowledge of the internal structures.

* **[Solution 3]:-** The pragmatic fix for a fire-and-forget write like this is a **tiny artificial delay** in the test to let the background write complete before asserting on it:
    * The **wait(100)** line: this is a real compromise, not an elegant solution — 100ms is usually plenty on a fast local machine, but on a slower CI runner it's theoretically possible for it to still be too short, causing an occasional flaky failure. The more robust production fix would be to make recordClick testable independently (e.g., export it and await it directly in a separate, more targeted test, rather than going through the full HTTP + fire-and-forget path) — but for the goal of "test the real user-facing behavior end-to-end," this tradeoff is a reasonable, honest one to accept and document, which is exactly what I'm doing by explaining it to you now rather than hiding it.

* **[Solution 4]:-** The clean fix: separate "what the job does" from "when the job runs."
    * This refactor is a genuinely important lesson, worth internalizing beyond just this project: code wrapped inside a scheduler, a route handler, or an event listener is much harder to test directly. Pulling the actual logic out into its own plain, exported function — one that the scheduler merely calls — makes it trivially testable in isolation, while the production behavior is completely unchanged. This same pattern applies everywhere: prefer thin route handlers / thin schedulers that delegate to plain, testable functions.

* **[Bug Fix 1]:-** **Explicitly wait for indexes to finish building in your test setup**
    * **Why this specific fix, and not something simpler:** **Model.init()** is Mongoose's own documented way to return a promise that resolves once that model's indexes are fully built — it's the correct tool here, not a workaround. This is also a genuinely useful thing to now know for production: the exact same race condition could theoretically bite you on a fresh production deploy too, if your app starts accepting traffic before Mongoose finishes building indexes on a brand new database. Good bug to have caught here, in tests, rather than in production.

* **[Understanding CI File]:-** **Walking through each piece, since this is my first CI file:**

    * **on: push / pull_request —** This defines when the workflow runs: every push to *main*, and every PR targeting *main*. The PR trigger is the more important one in practice — it means if you (or a future collaborator) open a PR with broken code, GitHub shows a red ❌ right on the PR before anyone merges it, not after.
    
    * **runs-on: ubuntu-latest —** GitHub spins up a fresh, throwaway Ubuntu virtual machine for this job. This is genuinely a fresh machine — no MongoDB, no Redis, no Node, nothing pre-installed. It's the actual proof that your test setup is properly self-contained, since it has to install everything from scratch and it still has to pass.
    
    * **actions/checkout@v4 —** pulls your actual repo code onto that fresh VM. Without this, there's no code to test at all.

    * **cache: 'npm' —** caches your *node_modules* between runs based on your *package-lock.json*. Without this, every single CI run would redownload every npm package from scratch, which is slow and wasteful. This is a real optimization worth understanding, not just a nice-to-have.

    * **npm ci, not npm install —** this is an intentional, important distinction. *npm ci (clean install)* deletes any existing *node_modules*, installs exactly what's locked in *package-lock.json*, and — critically — fails outright if *package.json and package-lock.json* are out of sync, rather than silently updating the lockfile the way *npm install* would. This is the standard for CI specifically because you want a guaranteed, reproducible install, not one that might quietly drift.

    * **env: JWT_SECRET: ci-test-secret —** remember your auth integration tests need *process.env.JWT_SECRET* to exist. Your local *.env* file isn't committed to git (it shouldn't be — more on that below) and doesn't exist on this fresh VM at all. This line explicitly provides that one variable directly to the CI job.

    * **No MongoDB or Redis setup step, on purpose —** this is the actual payoff of the architecture decisions we made earlier in the session. *mongodb-memory-server* downloads and runs its own disposable Mongo binary automatically, and Redis is fully mocked in every test file. If we'd gone with "Option A" (a real separate test database) back when I asked you to choose, this workflow file would need an extra *services:* block spinning up real MongoDB and Redis containers just for CI. You're seeing the direct benefit of that earlier choice right now.

## 🧪 Test before CI:
1. After Installing vitest, supertest & mongodb-memory-server add following to your package.json:

    ```text
        "scripts": {
        "test": "vitest run",
        "test:watch": "vitest"
    },
    ```

2.  ```bash
        npm test
    ```

## 🧪 Test after writing ci.yml:

1.  ```bash
        git add .
        git commit -m "Add CI workflow and automated test suite"
        git push
    ```

2.  Open Github, Go to Action tab and see automation test running. All the should pass.

## 🧪 Test for Intentional failing Pipeline to see CI transition:

🛑 **Step 1: Break the Code Locally**
1. Locate your URL validation function (e.g., isValidUrl).
2. Temporarily break it by removing the https check. For example, change it to:

    ```javascript
        // Temporarily broken code
        return parsed.protocol === 'http:'; // removed the 'https:' check
    ```
3. Save the file.

📤 **Step 2: Push the Broken Code to GitHub**   
* Open your terminal and run these commands to send the intentional bug to your repository:

    ```bash 
        git add .
        git commit -m "Test: Intentionally breaking URL validation to test CI pipeline"
        git push
    ```

📊 **Step 3: Watch the Pipeline Turn Red** 🔴  
1. Open your web browser and go to your **GitHub repository**.
2. Click on the **Actions** tab at the top.
3. You will see a new workflow run running (indicated by a yellow spinning circle).
4. Wait about 30 to 60 seconds. The circle will turn into a **Red Cross (❌)**, meaning the build failed.
5. Click on that specific workflow run, then click on the failed job (usually named something like test-and-build or build).
6. Expand the log lines for the **test execution step**. You will see the exact assertion failure showing that your HTTPS test cases failed.

🛠️ **Step 4: Revert the Code (Fix it)**  
Go back to your code editor and fix the function so it works correctly again.
1. Restore the https check:

    ```javascript
        // Fixed code
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    ```
2. Save the file

🎉 **Step 5: Push the Fix and Watch it Go Green** 🟢  
Send the corrected code back to GitHub:

    ```bash 
        git add .
        git commit -m "Test: Intentionally breaking URL validation to test CI pipeline"
        git push
    ```
Go back to your GitHub **Actions** tab. Watch the new workflow run. It will pull the fixed code, rerun the exact same test suite, and reward you with a satisfying **Green Checkmark (✅)**.

## 🏆 Achievements & Results:
✅ Succesfully implemented Unit & Integration Tests.
✅ All tests paased.
✅ Automated tests on every push and PR via CI
<br>
<br>
<br>
# [DATE: 26 AUG 2026] 

## 🎯 Goal for Today:
* ***Structured Logging - replace console.log with something fancier***
* ***Security Headers + HTTPS***

## ✅ What I Implemented / Built:
* Structured Logging via **Pino**
* Add a middleware which will redirect HTTP methods which are not HTTPS originally

## 🚧 Problems & Bugs Encountered:
* No Problem Yet

## 💡 Solutions & Learnings:
* **[Learned 1]:-** **Why not just keep console.log?**

    Worth being explicit about why this matters, not just doing it because it's on the list: console.log output is unstructured plain text — if you wanted to answer "show me every failed login in the last hour" from raw console output, you'd be grepping strings and hoping the format is consistent. **Structured logging means every log entry is a JSON object with consistent fields** (timestamp, level, message, request ID, user ID, etc.) — which means you can filter, search, and aggregate them like data, not just scroll through text.

* **[Choice ]:-**   
**Choosing a library — Pino over Winston**

    I'm picking Pino specifically, and it's worth understanding why: it's built for extremely low overhead (it does almost no work in the main thread — logging shouldn't slow down your actual request handling), and it outputs pure JSON by default, which is exactly the structured format you want. Winston is also legitimate and more commonly taught, but Pino is what's genuinely used in high-throughput production Node services, and given this project's whole narrative is about performance, it's the more consistent choice.

    ```bash
        npm install pino pino-http
        npm install -D pino-pretty
    ```

    **Why pino-pretty is dev-only:** raw JSON logs are exactly what you want in production (machine-readable, feeds into log aggregators), but they're painful to read directly in your terminal while developing. pino-pretty reformats them into colored, readable lines — but only locally, never in production, where you actually want the raw structured format.

* **[Learned 2]:-** **Why level is configurable via env var, not hardcoded:** log levels (in increasing severity: trace, debug, info, warn, error, fatal) let you control verbosity without touching code. In production you might run at info (skip noisy debug details), but if you're actively debugging a live issue, you could temporarily bump it to debug via an environment variable change and redeploy — no code change needed.

* **[Learned 3]:-** **Why genReqId with a UUID matters — this is the single most valuable piece of today's work:** every incoming request gets a unique ID attached to it, and every log line generated during that request (in your controllers, services, wherever) can include that same ID. That means if a user reports "my redirect failed around 3:15pm," and your app returned that request's ID to them (or you can correlate via timestamp), you can search your logs for that exact single request ID and see its entire lifecycle — every log line it touched, in order — instead of guessing which of thousands of interleaved log lines from concurrent requests belong to that one failure. This is called a correlation ID, and it's a real, standard production pattern, not a nice-to-have.

    **Why we explicitly ignore /health/live:** if you have an uptime monitor or load balancer hitting this every few seconds (which you will, in real deployment), logging every single one would drown out logs that actually matter. Health checks are noise once you trust the system is healthy — you want them excluded, not celebrated.

* **[Learned 4]:-** **req.log vs plain logger — the actual rule**

    This is genuinely simple once you see the pattern: it's not about file type or "importance" — it's purely about whether you have access to req at that point in the code.

    |**Situation**	    |**Use** 	     |**Why**     |
    | :-------------:   | :-------------:| :--------: |
    |Inside a **controller function** — (req, res) => {...} |req.log    |You have req right there; using it gives you the automatic correlation ID for free|
    |Inside a **middleware** — (req, res, next) => {...}    |req.log    |Same reason — req is available|
    |Inside a **service function** that does NOT receive req as a parameter |logger (the plain imported one)    |There's no req in scope at all — recordClick, createShortUrl, getOriginalUrl are called with plain arguments like shortCode, longUrl, never req itself|
    |**Server startup code** — server.js, DB/Redis connection files|	logger|	This code runs before any request even exists — there's no req to attach to|
    |**Cron jobs** — expireLinks.job.js|	logger|	Runs on a timer, completely outside any request lifecycle — no req involved at all|

**The concrete test to ask yourself every time:** "Is there a req object visible in this function's parameters or closure?" If yes → req.log. If no → logger.

* **[Learned 5]:-** **What helmet actually is, not just "install it because everyone says to":** it's a collection of small middleware functions, each setting one specific HTTP response header that tells browsers to enforce a security behavior. Rather than you hand-writing a dozen headers and getting subtle details wrong, Helmet sets sensible, battle-tested defaults for all of them at once.

    ```text
        app.use(helmet())
    ```
    Let's actually understand what this one line does, header by header — since "just add helmet" without understanding it defeats the point of learning:

    |**Header**  	|**What it prevents** |
    | :------------:| :------------------:|
    |**X-Content-Type-Options: nosniff** |	Stops browsers from guessing a file's type differently than declared — prevents a malicious file disguised as an image from executing as a script|
    |**X-Frame-Options: SAMEORIGIN** |	Prevents your site from being embedded in an \<iframe> on someone else's malicious page — blocks clickjacking (tricking a user into clicking something on your site while it's invisibly framed under a fake UI)|
    |**Strict-Transport-Security (HSTS)** |	Tells the browser "always use HTTPS for this domain, never fall back to HTTP" — even if a user types http:// or clicks an old http:// link|
    |**Content-Security-Policy (CSP)** |	Restricts what sources scripts/styles/images can load from — a major defense against XSS (cross-site scripting)|
    |**Referrer-Policy** |	Controls how much of your URL gets leaked to external sites when a user clicks a link away from your site |
    |**X-DNS-Prefetch-Control** |	Prevents browsers from pre-resolving DNS for links on your page, which can leak browsing intent |

* **[To be Done]:-
    * **One thing worth doing deliberately, not just accepting the default:** Helmet's default CSP is fairly strict and can actually break things if you're serving any inline scripts or loading resources from external domains later (e.g., if your React frontend loads a CDN font). For an API-only backend (which is what this Express app actually is — your React UI is a separate app), the default CSP mostly doesn't apply in a meaningful way since you're not serving HTML pages from here. But it's worth explicitly configuring once your frontend is deployed alongside it, so flag this as something to revisit at deployment time rather than something to over-engineer now.

* **[Learned 6]:-** **HTTPS**

    This is the part where I want to be precise about what's actually your responsibility versus what happens at deployment, because getting this backwards is a common point of confusion.

    * **Your Node/Express app itself does not need to implement HTTPS/TLS directly** — and in most real deployments, it deliberately doesn't. Here's the standard architecture: your Express app runs plain HTTP internally, and a reverse proxy in front of it (Nginx — which you already have! — or your cloud provider's load balancer) terminates HTTPS: it holds the actual TLS certificate, decrypts incoming HTTPS traffic, and forwards plain HTTP to your Node app behind it. This is called **TLS termination**, and it's the standard pattern, not a shortcut.

    * **Why this matters for you specifically right now:** you already built an Nginx layer in Day 6. That's exactly where HTTPS termination belongs — not inside your Node app.

    * **What you can and should do in Express right now** — enforce that HTTP requests get redirected to HTTPS, so if somehow a request reaches your app over plain HTTP (bypassing Nginx, or before your cert is set up), you don't silently serve insecure traffic.

    * **Why this checks x-forwarded-proto instead of something like req.secure:** since Nginx sits in front of your app and terminates TLS itself, your actual Node process never sees an HTTPS connection directly — it only ever sees plain HTTP from Nginx. Nginx is responsible for telling your app "hey, the original request from the browser was HTTPS" via this specific header. This is why trust proxy (which you already set) matters here too — it's part of the same trust chain.

    * **Why this only activates in production:** locally, you're testing over plain http://localhost:5000 deliberately — forcing HTTPS redirects during local development would just break all your Postman/curl testing for no benefit. This is exactly the same dev/prod branching pattern you already used for Pino's pretty-printing.

    * **Update your Nginx config (nginx/nginx.conf) to actually pass that header through** — check that it's there, since it's easy to miss:

        ```ngingx
            location / {
                proxy_pass http://url_shortener_backend;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        ```
        That last line **(X-Forwarded-Proto $scheme)** is the one your new Express middleware depends on — without it, your app has no way to know whether the original request was HTTP or HTTPS.

* **[To be Done]:-** **Where the actual TLS certificate comes from — this is a Day 7 deployment concern, not something to set up locally:** when you deploy, you'll either use your hosting platform's built-in HTTPS (Render, Railway, Fly.io all provision this automatically for you, zero config), or if you're managing your own server with Nginx directly, you'd use **Let's Encrypt** (via certbot) to get a free, auto-renewing certificate. I'd hold off on setting up a real certificate until we get to actual deployment — testing HTTPS locally with a self-signed cert is mostly just friction with no real learning payoff, since browsers will complain about self-signed certs regardless of whether your code is correct.

## 🧪 Test for Structured Log:
Start your server and hit a few endpoints. In dev mode, you should see nicely colorized, readable log lines like:

```text
    [14:32:10] INFO: request completed
    reqId: "a1b2c3..."
    res: { statusCode: 201 }
    responseTime: 12
```

**Now the real test — correlation IDs actually working:** hit POST /shorten with an invalid URL, and look at the log output. You should see two log lines sharing the exact same reqId — one from req.log.warn(...) inside your controller, and one from pino-http's automatic request-completion log. That shared ID is the entire point.

Temporarily set **NODE_ENV=production** in your .env and restart — you should now see raw JSON instead of colored pretty-print, confirming the dev/prod split works correctly. Switch it back to development afterward for continued local work.

## 🧪 Test for Security Header (What we can do now):
**Test 1 — Confirm Helmet headers are present:**

```bash
    curl -I http://localhost:5000/health/live
```

Look for X-Content-Type-Options, X-Frame-Options, and a few others in the response headers — these should now appear where they didn't before.

**Test 2 — Confirm the HTTPS redirect logic doesn't break local dev:**
Since NODE_ENV is development locally, hitting any endpoint normally should work completely unaffected. Confirm nothing broke.

**Test 3 — Simulate what production would do (optional, quick check):**
Temporarily set *NODE_ENV=production* in .env, restart, then:

```bash
    curl -I http://localhost:5000/health/live
```

Since there's no x-forwarded-proto header at all in this raw request (nothing set it), it won't equal 'https', so you should see a **301 redirect response**. This confirms the logic fires correctly — just remember to switch NODE_ENV back to development afterward, or your local testing will start redirecting everywhere unexpectedly.

## 🏆 Achievements & Results:
✅ Successfully Structured Logging implemented  
✅ Test for Security Header Passed without breaking any route
<br>
<br>
<br>
# [DATE: 27 AUG 2026] 

## 🎯 Goal for Today:
* ***Sentry Error Tracking***
* ***Implement a live, interactive API documentation page, plus a machine-readable spec file that could power API clients or contract testing later***
* ***To see clicks per day over the last week/month rather than just a lifetime total***

## ✅ What I Implemented / Built:
* Implemented Sentry error tracking to receive error via email instead of scrolling through logs
* Implemented interactive API documentation page using OpenAPI docs
* Implemented Time-Series Analytics and automated tests

## 🚧 Problems & Bugs Encountered & their Fixes:
* **[Problem 1]:-** Encountered URL Not Found error for /api-docs route  
**[Solution]:-** Place /api-docs route below all middlewares and above all routes in *app.js*

* **[ERROR]:-** [04:54:26] ERROR: MongoDB connection failed: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted. Make sure your current IP address is on your Atlas cluster's IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/  
**[Reason]:-**  IP address most likely changed overnight  
**[FIX]:-** This error means your MongoDB Atlas database is blocking your application because it does not recognize your current internet connection's IP address. Atlas uses a strict firewall to keep unauthorized users out.  
Here is how to fix it in 3 quick steps:  
**1. Log In to MongoDB Atlas**
    * Go to the MongoDB Atlas dashboard.
    * Select your project.

    **2. Add Your Current IP**
    * Click Network Access under the "Security" section in the left sidebar.
    * Click the Add IP Address button.
    * Click Add Current IP Address to automatically fill in your current network ID.
    * Click Confirm and wait about a minute for the status to change to Active.  

    **3. *(Alternative)* Allow Access From Anywhere**  
If you are traveling, switching networks constantly, or deploying to a cloud server with a dynamic IP, you can temporarily open access to all locations:
    * Follow the steps above, but instead of adding your current IP, click **Allow Access From Anywhere**.
    * This sets the IP entry to 0.0.0.0/0.
    * *Warning:* Only use this if you have a very strong database password, as it allows anyone to attempt to connect.

* **[BUG 1]:-** Redirect route (/\<shortcode>) is showing CORS error in Swagger UI when long URL is another website link like *wikipedia*  
**[NO FIX Needed]:-** **What's actually happening**

    Swagger UI's "Try it out" button uses the browser's fetch() API to make the request. When your server responds with a 302 redirect, the browser's fetch() automatically tries to follow that redirect — and then tries to read Wikipedia's response to display it in the Swagger UI panel. Wikipedia's server doesn't allow being read cross-origin by a random fetch call from localhost:5000 (no CORS headers permitting it) — so the browser blocks it and fetch() throws "Failed to fetch".

    **This is a limitation of testing redirects through browser-based tools, not a bug in your app**. Any endpoint that redirects to an external domain will hit this same issue in Swagger UI, Postman's "send and follow redirects" mode, or literally any fetch-based tester — because the final destination's CORS policy is what's blocking it, and you have zero control over Wikipedia's CORS settings.

    **How to actually verify this endpoint works**
    * **Paste the short URL directly into your browser's address bar*8 (not through Swagger UI) — this is a real page navigation, not a fetch() call, so it isn't subject to CORS at all. It'll redirect to Wikipedia correctly.
    * **Postman**, with "Automatically follow redirects" turned OFF (like we did back in Day 2 testing) — you'll cleanly see the 302 and Location header without Postman trying to chase it down.
    * **curl -I** — shows just the redirect response headers, no CORS involved.

## 💡 Learnings & Reasons:
* **[Implementation Reason]:-** **Why Sentry specifically, and what it adds beyond your logging**

    Your Pino logging (from earlier) writes structured logs to your terminal/log files — but **nobody is watching that terminal at 2am**. Sentry's actual job is different: it captures errors as they happen, groups identical errors together (so 500 occurrences of the same bug show up as "1 issue, 500 times" not 500 separate alerts), and can notify you (email/Slack) the moment something new breaks — plus it captures the full stack trace, request context, and even the exact line of source code, in a searchable dashboard, not a scrolling terminal.

    **Account & project setup:-**
    * Go to sentry.io, create a free account, create a new project, choose Node.js/Express as the platform. Sentry will give you a DSN (a unique URL that tells your app where to send error data) — copy it.

    * Add to .env:
    
        ```env
            SENTRY_DSN=https://your-actual-dsn-here@sentry.io/your-project-id
        ```
    
    * Install:

        ```bash
            npm install @sentry/node
        ```

* **[Learned 1]:-**   
    * **Why tracesSampleRate differs between dev and prod:** this controls what fraction of requests get detailed performance tracing (not just errors — full request timing breakdowns). 1.0 in dev means "trace everything" since your traffic is just you testing. 0.1 in production means "trace 10% of requests" — because at real scale, tracing every single request adds overhead and cost; sampling gives you a statistically representative picture without the full expense. This exact tradeoff — sampling for cost/performance vs completeness — is a recurring theme in production observability, worth remembering beyond just Sentry.

    * **Why we check if (!process.env.SENTRY_DSN) and bail gracefully:** this means your app runs completely normally with zero Sentry overhead if the DSN isn't configured — useful for CI (where you don't want tests accidentally sending real error events to your Sentry project) and for anyone cloning this repo without their own Sentry account.

* **[Learned 2]:-** 
    * **Why the ordering initSentry() is genuinely strict, not just tidy:** Sentry's Node SDK works by automatically instrumenting things like Express, HTTP requests, and database calls — but only if it's initialized before those modules are imported and set themselves up. If you *initSentry()* after *app.js* is already imported and Express is already configured, Sentry can miss capturing errors from parts of the app it never got a chance to instrument. This is a real, commonly-made mistake — "I added Sentry but it's not catching anything" is very often just an ordering bug like this.

    * **Why the ordering matters in app.js- *Sentry.setupExpressErrorHandler(app);* too, same principle as before:** Express middleware and error handlers execute in the order they're registered. If your own error handler ran first and already sent a response, Sentry's handler downstream would never even get the chance to see the error. Sentry needs to intercept it first, then let it continue to your handler for the actual user-facing response.

    * **Sentry auto-captures unhandled errors** that reach Express's error-handling flow, but your controllers currently **catch their own errors** in try/catch blocks and handle them manually (returning a clean 500 response) — which means those errors never reach Sentry's automatic handler at all. You need to explicitly tell Sentry about them.

        * **The reliable way to find every spot, rather than guessing:** search your project for the literal string catch (error) or catch (err) across all files:

            ```bash
                grep -rn "catch (error)" src/
            ```
        
            Every result is a candidate. For each one, ask: ***"Does this catch block sit inside something Express's automatic handler will ever see?"*** If yes (a normal controller inside a route) — it still needs the manual call, because Express's handler only sees errors that reach it, and a caught error never does, ever, regardless of where the catch is. If no (a cron job, a fire-and-forget function) — it definitely needs the manual call, because there's no fallback safety net at all.

* **[Choosing Library]:-** **swagger-jsdoc + swagger-ui-express** is the standard pairing for an existing Express app like yours: you write documentation as JSDoc-style comments directly above each route, a tool compiles those comments into an OpenAPI spec, and a UI renders that spec as an interactive page where anyone can browse and even test your endpoints directly in the browser.

    ```bash
        npm install swagger-jsdoc swagger-ui-express
    ```

* **[Learned 3]:-** 
    * **Why components.securitySchemes matters:** this defines once, centrally, what "authenticated" means for your API (a Bearer JWT token). Individual routes then just reference bearerAuth by name rather than re-explaining the auth mechanism every time — and critically, this is what makes Swagger UI show a padlock icon and an "Authorize" button, letting someone paste in a token once and have it applied to every subsequent test request they make from the docs page.

    * **security: [{ bearerAuth: [] }, {}] on the /shorten route specifically** — this is deliberately unusual and directly reflects a real architectural decision you made back on Day 5. Most authenticated routes only list bearerAuth. This one lists both bearerAuth and an empty object {} — which tells Swagger "this endpoint accepts a token OR no token at all." That's not boilerplate — it's the documentation correctly reflecting optionalAuth, the exact middleware you built specifically because anonymous and logged-in users both need to hit this same endpoint. Good documentation should reflect real design decisions like this, not just list "requires auth: yes/no."

    * **Why tags matter ([URLs], [Auth], [Analytics], [QR Codes])** — Swagger UI groups endpoints into collapsible sections by tag. Without tags, you'd get one long flat list of every route; with them, someone browsing your docs sees a clean, organized structure that mirrors how you actually think about the API's boundaries.

* **[Time-Series Design Decision]:-** 
    * **Which time buckets?** Days by default, since that's the most universally useful view (a chart of "clicks per day"). We'll parameterize it so hourly is also possible for a busy single day, but default to daily.

    * **How to group by day in MongoDB, without pulling every raw document into Node and grouping manually?** Use the aggregation pipeline's $dateTrunc operator — this truncates each timestamp down to the start of its day (or hour), directly in the database, which is far more efficient than fetching potentially millions of raw click events and grouping them in JavaScript.

    * **Do we need a new index?** Yes — worth adding one now, because time-series queries filter by *short_code* and range over *timestamp* together. A compound index on both fields together is what actually makes this fast at scale; without it, MongoDB would use one field's index and then manually scan for the other.

    * **Why compound and not two separate single-field indexes:** MongoDB can only efficiently use one index per query in most cases. If you had a separate index on *short_code* and a separate one on *timestamp*, a query filtering on both would pick one of them and still have to manually scan through all matching documents to check the other condition. A compound index **{ short_code: 1, timestamp: 1 }** lets MongoDB jump directly to the exact range of documents matching both conditions at once — this is a real, meaningful performance difference once your *ClickEvent* collection has real volume.

    * **Why the "fill in zero-click days" step matters, and isn't just extra polish:** MongoDB's aggregation only returns groups that actually have at least one matching document. If a link got zero clicks on a Tuesday, there's simply no group for Tuesday in the raw results — it's absent, not present with a **0**. If you fed that directly into a chart, Tuesday would just be skipped entirely, visually compressing the timeline and making it look like Monday was immediately followed by Wednesday. Explicitly building the full date range and filling gaps with **0** is what makes the resulting data honestly represent a continuous timeline — this is a genuinely common, easy-to-miss bug in real analytics dashboards.

* **[Learned 4]:-** **Why Math.min(..., 90) on the days parameter:** without this cap, someone could request **?days=999999** and force MongoDB to scan and bucket years of data in one query — a cheap, easy way to accidentally (or deliberately) create a slow, expensive request. Capping user-controlled range parameters like this is a small habit worth having everywhere a client can specify "how much data to return."

## 🧪 Test for Sentry Error Tracking:
Add a deliberately broken temporary test route to confirm Sentry receives real errors, then remove it:

```javascript
    // TEMPORARY — remove after confirming Sentry works
    router.get('/debug-sentry', () => {
    throw new Error('Test error for Sentry verification');
    });
```

Hit GET http://localhost:5000/debug-sentry in Postman, then check your Sentry dashboard — within a few seconds, you should see this exact error appear, with the full stack trace, the request URL, headers, and — since you're running in development with tracesSampleRate: 1.0 — timing information too.

**Once confirmed, delete that route** — it's a real, unguarded way to crash your server on demand, and has no business existing outside this one verification step.

## 🧪 Test for OpenAPI docs:
Restart your server, visit http://localhost:5000/api-docs again — you should now see a fully organized, interactive page with all your endpoints grouped by tag, example request bodies, and documented response codes.

The genuinely satisfying test: click "Authorize" at the top, log in via Postman first to get a real JWT, paste it in, then use Swagger UI's "Try it out" button directly on GET /api/urls/my — it should actually execute a real request against your running server and show you the real response, right there in the browser. This is the point where "documentation" becomes "documentation you can also use as a testing tool" — genuinely useful even for you, day to day, not just for someone evaluating your project.

## 🧪 Test for Time-Series Analytics:
1. **Hit the endpoint:**

    ```text
        GET http://localhost:5000/api/analytics/d/timeseries?days=7
    ```
    **Expected shape:**

    ```json
        {
            "shortCode": "d",
            "days": 7,
            "timeSeries": [
                { "date": "2026-08-19", "count": 0 },
                { "date": "2026-08-20", "count": 0 },
                { "date": "2026-08-21", "count": 2 },
                { "date": "2026-08-22", "count": 1 },
                { "date": "2026-08-23", "count": 0 },
                { "date": "2026-08-24", "count": 0 },
                { "date": "2026-08-25", "count": 1 }
            ]
        }
    ```
    **What to actually verify, not just glance at:** confirm you get exactly 7 entries (not just the days that had data), confirm the zero-count days are genuinely present with count: 0, and confirm the counts on the days you seeded data match what you inserted.

2. **Cap enforcement:**

    ```text
        GET http://localhost:5000/api/analytics/d/timeseries?days=99999
    ```
    Should return exactly 90 days, not 99999 — confirming the cap actually works, not just exists in the code.

3. **Non-existent short code:**

    ```text
        GET http://localhost:5000/api/analytics/doesnotexist/timeseries
    ```
    Should be 404, consistent with your existing /api/analytics/:shortCode behavior.

## 🏆 Achievements & Results:
✅ Successfully seeing error listed in Sentry dashboard  
✅ Receiving errors via email no need to scroll through loggings to find error  
✅ Now we have a live, interactive API documentation page  
✅ Successfully implemented and Time-Series Analytics