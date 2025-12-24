# RedditTrack – Reddit Post Analysis Platform

RedditTrack is a full-stack web application that analyzes Reddit posts in real time.  
Users can paste any public Reddit post URL to instantly fetch post data, run sentiment analysis on the content, and visualize engagement metrics through a clean, responsive UI.

The project focuses on **API integration, real-time analysis, and frontend–backend coordination**, without relying on any database or external storage.

---

## 🚀 Live Demo

- **Frontend:** https://reddit-post-analysis-two.vercel.app  
- **Backend:** Hosted separately (API-based architecture)

---

## 🧠 What This Project Does

RedditTrack allows users to:

- Fetch Reddit post metadata directly from the Reddit API  
- Analyze the emotional polarity of the post text  
- View engagement metrics such as upvotes, comments, and upvote ratio  
- Instantly visualize results without saving any data  
- Use a modern UI with dark/light theme support  

This makes RedditTrack ideal for **quick sentiment inspection, content analysis, and API-driven analytics demos**.

---

## ✨ Features

### Core Features
- Paste any public Reddit post URL  
- Fetch post title, author, score, comments, and ratio  
- Perform sentiment analysis on post content  
- Display analytics in a structured dashboard  
- Light / Dark mode toggle  
- Fully responsive UI  

### Technical Highlights
- No database (stateless API design)  
- Clean separation of frontend and backend  
- Robust error handling for invalid URLs and API failures  
- Rate-limited backend requests  
- Optimized for deployment on serverless platforms  

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite)** – fast development and build times  
- **Tailwind CSS** – utility-first styling  
- **Lucide Icons** – clean iconography  

### Backend
- **Node.js**  
- **Express.js**  
- **Axios** – Reddit API requests  
- **Sentiment (NPM)** – text sentiment scoring  
- **dotenv** – environment configuration  

---

## 📁 Project Structure

```text
root/
├── backend/
│   ├── controllers/
│   │   └── redditController.js
│   ├── routes/
│   │   └── redditRoutes.js
│   ├── services/
│   │   └── redditService.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── public/
│   ├── index.html
│   └── vite.config.js
│
├── README.md
└── package.json
```
🔐 Environment Variables

Create a .env file inside the backend/ directory:

```
REDDIT_USER_AGENT=your_user_agent_here
PORT=5000
```

Reddit requires a valid User-Agent for API access.

▶️ Running Locally
1️⃣ Clone the repository

```
git clone https://github.com/aadiakshat/Reddit-Post-Analysis.git
cd Reddit-Post-Analysis
```

2️⃣ Start the backend

```
cd backend
npm install
npm start

```

Backend runs at:

```
http://localhost:5000
```

3️⃣ Start the frontend

```
cd ../frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

🔌 API Reference
POST /api/reddit/analyze

Analyze a Reddit post using its URL.

Request Body
```
{
  "url": "https://www.reddit.com/r/.../comments/..."
}
```
Sample Response

```
{
  "title": "Post title",
  "author": "username",
  "ups": 4200,
  "comments": 156,
  "upvoteRatio": 0.91,
  "sentiment": 0.78
}

```

⚠️ Error Handling

RedditTrack gracefully handles:

Invalid Reddit URLs

Deleted or private posts

Reddit API rate limits

Network or server errors

User-friendly error messages are displayed in the UI.

🔮 Future Improvements

NLP-based sentiment model (BERT / transformer-based)

Comment-level sentiment analysis

Data visualization charts (engagement trends)

Export analysis as PDF or JSON

WebSocket-based live updates

📜 License

MIT License

👤 Author

Adarsh Akshat
B.Tech EEE @ NITK
Focused on full-stack development, system design, and ML-powered analytics

GitHub: https://github.com/aadiakshat









🔐 Environment Variables

Create a .env file inside the backend/ directory:
