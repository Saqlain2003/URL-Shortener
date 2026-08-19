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