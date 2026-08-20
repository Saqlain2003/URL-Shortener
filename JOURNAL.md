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