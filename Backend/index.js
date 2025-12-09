const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

require('dotenv').config();

const redditRoutes = require('./routes/reddit');

const app = express();
const PORT = process.env.PORT || 5000;

// Fix CORS - Add this exact middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://your-frontend.vercel.app'
  ],
  credentials: true
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/reddit', redditRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path
  });
});

// MongoDB connection
if (process.env.MONGO_URL) {
  mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.log('❌ MongoDB connection error:', err.message));
} else {
  console.log("⚠️ MONGO_URL is missing! Add it to your .env file.");
}


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 POST test: curl -X POST http://localhost:${PORT}/api/reddit/post -H "Content-Type: application/json" -d '{"url":"https://www.reddit.com/r/interestingasfuck/comments/1pfhlr6/man_in_india_calmly_shares_food_with_sloth_bears/"}'`);
});