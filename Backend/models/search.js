const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema({
  url: String,
  subreddit: String,
  title: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Search", searchSchema);
