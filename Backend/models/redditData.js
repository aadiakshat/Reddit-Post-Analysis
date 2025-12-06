const mongoose = require("mongoose");

const redditPostSchema = new mongoose.Schema({
  postId: String,
  title: String,
  author: String,
  subreddit: String,
  ups: Number,
  comments: Number,
  upvoteRatio: Number,
  sentiment: Number,
  text: String,
  flair: String,
  thumbnail: String,
  created: Number,
  fetchedAt: { type: Date, default: Date.now }
});

// User info
const redditUserSchema = new mongoose.Schema({
  username: String,
  totalKarma: Number,
  postKarma: Number,
  commentKarma: Number,
  created: Number,
  icon: String,
  fetchedAt: { type: Date, default: Date.now }
});

// Subreddit info
const subredditSchema = new mongoose.Schema({
  name: String,
  subscribers: Number,
  activeUsers: Number,
  description: String,
  icon: String,
  fetchedAt: { type: Date, default: Date.now }
});

module.exports = {
  RedditPost: mongoose.model("RedditPost", redditPostSchema),
  RedditUser: mongoose.model("RedditUser", redditUserSchema),
  SubredditInfo: mongoose.model("SubredditInfo", subredditSchema)
};