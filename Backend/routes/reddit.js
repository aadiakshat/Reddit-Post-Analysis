const express = require("express");
const router = express.Router();
const redditController = require("../controller/redditController");

router.post("/post", redditController.fetchPostAnalytics);
router.get("/user/:username", redditController.getUserAnalytics);
router.get("/subreddit/:name", redditController.getSubredditAnalytics);

router.get("/test", (req, res) => {
  res.json({
    message: "Reddit API route is working!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
