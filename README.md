# Reddit Post Analysis

A full-stack application that fetches Reddit post details from the Reddit API, performs sentiment analysis, and displays analytics in a clean and responsive UI.

## Features

- Fetch Reddit post details by pasting the post URL
- Analyze sentiment of the post text
- Display engagement metrics such as upvotes, comments, and upvote ratio
- Clean UI with light/dark theme toggle
- Error handling for invalid posts or API failures
- Fully frontend–backend integrated, but without any database

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js
- Express
- Axios (for fetching Reddit data)
- Sentiment (NPM package for sentiment scores)

## Project Structure
```
```
root/
 ├── backend/
 │    ├── controllers/
 │    ├── routes/
 │    └── server.js
 │
 ├── frontend/
 │    ├── src/
 │    ├── public/
 │    └── vite.config.js
 │
 ├── README.md
 └── package.json
```
```
## Environment Variables

Create a `.env` file inside `backend/`:

\`\`\`
REDDIT_USER_AGENT=your_user_agent
PORT=5000
\`\`\`

## Running Locally

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/aadiakshat/Reddit-Post-Analysis.git
\`\`\`

### 2. Run the backend
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

### 3. Run the frontend
\`\`\`bash
cd ../frontend
npm install
npm run dev
\`\`\`

## API Endpoint

### POST `/api/reddit/analyze`

Request Body:
\`\`\`json
{
  "url": "https://www.reddit.com/r/.../comments/..."
}
\`\`\`

Sample Response:
\`\`\`json
{
  "title": "Post title",
  "ups": 4200,
  "comments": 156,
  "upvoteRatio": 0.91,
  "sentiment": 0.78
}
\`\`\`

## Future Improvements

- More accurate NLP-based sentiment model
- Add charts for visual analytics
- Support for analyzing comments
- Option to export analysis results

## License

MIT License
