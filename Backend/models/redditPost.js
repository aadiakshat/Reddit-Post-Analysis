const mongoose = require("mongoose");

const redditPostSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true },

  title: String,
  author: String,
  subreddit: String,

  // Engagement
  score: Number,
  upvotes: Number,
  comments: Number,
  upvote_ratio: Number,
  awards: Number,

  // Metadata
  created: Date,
  url: String,
  domain: String,
  thumbnail: String,
  is_video: Boolean,

  // Sentiment
  sentiment: {},

  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RedditPost", redditPostSchema);
