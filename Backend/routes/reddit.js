  const express = require('express');
  const router = express.Router();
  const redditController = require('../controller/redditController');
  
  // POST endpoint for post analytics
  router.post('/post', redditController.fetchPostAnalytics);

  // GET endpoint for user analytics
  router.get('/user/:username', redditController.getUserAnalytics);

  // GET endpoint for subreddit analytics
  router.get('/subreddit/:name', redditController.getSubredditAnalytics);

  // Add a test endpoint to verify route is working
  router.get('/test', (req, res) => {
    res.json({ 
      message: 'Reddit API route is working!',
      timestamp: new Date().toISOString()
    });
  });
  module.exports = router;