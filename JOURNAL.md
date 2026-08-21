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

## 🚧 Problems & Bugs Encountered:
* **[Problem 1]:-** Showing empty count for non-existing URL instead of ***404 - Not Found***
* **[Problem 2]:-** Non Existing URL searches cache and get miss, then searches DB and return 404. If 10000 simultaneously non existing URL is send, DB will crashed. ***[Cache Penetration]***

## 💡 Solutions & Learnings:
* **[Solution 1]:-** Check DB if URL exist if not return ***404 - Not Found***
* **[Solution 2]:-** By Storing ***Negative TTL*** and ***Sentinel String(__NULL__)*** in cache for short duration (e.g. 60seconds) for non-existing visited URL
* **[Understand];-** A few things worth understanding, not just pasting:

1. **Why a sentinel string (__NULL__) and not just caching an empty string ""?** Because redisClient.get() returning an empty string vs returning null (key doesn't exist at all) can be easy to confuse in a conditional check. A distinct, unmistakable sentinel value removes any ambiguity about what's actually being represented — "we checked, and it doesn't exist" is a real piece of information, distinct from "not in cache at all."  

2. **Why the negative TTL (60s) is much shorter than the positive TTL (3600s):** this is the important tradeoff to actually understand. If someone requests a code that doesn't exist yet, you cache "not found" for 60 seconds. If that exact code gets created 10 seconds later (rare, but possible — e.g., someone typo's a link, then the real owner creates that alias moments later), your negative cache would incorrectly keep saying "not found" for up to 60 more seconds. A full hour would make that problem much worse. 60 seconds is a reasonable balance: long enough to actually stop a penetration attack/repeated-miss pattern, short enough that a legitimate new URL doesn't stay invisible for long.

3. **Why createShortUrl now calls redisClient.del() on the new code:** this directly closes the edge case from point 2. The moment a URL is actually created, we proactively clear any stale negative cache entry for that exact code — so even within that 60-second window, a legitimate creation immediately becomes visible rather than waiting out the TTL.

## 🧪 Test in Postman:
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

## 🏆 Achievements & Results:
✅ Successfully tested analytics route.
✅ Implemented Cache Penetration Fix.