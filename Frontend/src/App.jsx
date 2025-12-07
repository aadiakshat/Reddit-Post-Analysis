import React, { useState, useEffect } from 'react';
import { Sun, Moon, TrendingUp, MessageCircle, ThumbsUp, Activity, Calendar, User, Hash, Award, Clock, BarChart3, AlertCircle } from 'lucide-react';

/* ---------------------- THEME TOGGLE ---------------------- */
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
      className={`
        relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
        transition-all duration-300 ease-out shadow-inner
        border focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-slate-600'
            : 'bg-slate-100 border-slate-200 text-slate-600 focus:ring-sky-300'
        }
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        <Sun 
          size={16} 
          className={`absolute transition-all duration-300 ${
            theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 opacity-100 rotate-0'
          }`} 
        />
        <Moon 
          size={16} 
          className={`absolute transition-all duration-300 ${
            theme === 'dark' ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'
          }`} 
        />
      </span>
      <span className="text-xs font-semibold tracking-wide hidden sm:inline">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

/* ---------------------- SMALL STAT CARD ---------------------- */
const StatCard = ({ icon: Icon, label, value, trend, description, large }) => (
  <div className={`rounded-2xl bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow
    ${large ? "col-span-2 md:col-span-3 lg:col-span-2" : ""}`}>
    
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
        <Icon size={18} className="text-slate-600 dark:text-slate-300" />
      </div>

      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend > 0 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : trend < 0
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>

    <p className={`font-bold text-slate-900 dark:text-white mb-1 
      ${large ? "text-3xl" : "text-2xl"}`}>
      {value}
    </p>

    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>

    {description && (
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{description}</p>
    )}
  </div>
);

/* ---------------------- SENTIMENT BADGE ---------------------- */
const SentimentBadge = ({ sentiment }) => {
  // Handle both sentiment object and numeric score
  const getScore = () => {
    if (typeof sentiment === 'object') {
      return sentiment.score || sentiment.compound || 0;
    }
    return sentiment || 0;
  };

  const getLabel = () => {
    if (typeof sentiment === 'object') {
      return sentiment.label || sentiment.sentiment || 'Neutral';
    }
    const score = getScore();
    if (score >= 0.1) return 'Positive';
    if (score <= -0.1) return 'Negative';
    return 'Neutral';
  };

  const getSentimentColor = () => {
    const score = getScore();
    if (score >= 0.1) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (score <= -0.1) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  };

  return (
    <div className={`px-3 py-1 rounded-full ${getSentimentColor()}`}>
      <span className="text-sm font-medium">{}</span>
      {<span className="text-xs ml-2">({getScore().toFixed(2)})</span>}
    </div>
  );
};

/* ---------------------- ANALYTICS DASHBOARD ---------------------- */
const AnalyticsDashboard = ({ analysis }) => {
  // Extract data from analysis object (which is the data property from response)
  const postData = analysis;
  
  // Format stats based on actual response structure
 
  const stats = [
    {
      icon: ThumbsUp,
      label: "Upvotes",
      value: postData.upvotes ?? 0,
      description: "Total upvotes"
    },
    {
      icon: MessageCircle,
      label: "Comments",
      value: postData.num_comments ?? 0,
      description: "Total comments"
    },
    {
      icon: Activity,
      label: "Score",
      value: postData.score ?? 0,
      description: "Post score"
    },

    // ⭐ BIG CREATED CARD
    {
      icon: Clock,
      label: "Created",
      value: postData.created_utc
        ? new Date(postData.created_utc * 1000).toLocaleString()
        : "N/A",
      description: "When this post was published",
      large: true // custom flag to make it larger
    },

    {
      icon: Award,
      label: "Awards",
      value: postData.total_awards_received ?? 0,
      description: "Awards received"
    }
  ];



  return (
    <div className="space-y-6">
      {/* Warning Banner if needed */}
      {analysis.warning && (
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">{analysis.warning}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Post Details Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash size={18} />
            Post Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Post ID</span>
              <span className="font-medium font-mono">{postData.postId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Subreddit</span>
              <span className="font-medium">r/{postData.subreddit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Author</span>
              <span className="font-medium">u/{postData.author}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Flair</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-sm">
                {postData.link_flair_text || 'None'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">NSFW</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                postData.over_18 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {postData.over_18 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Sentiment</span>
              <SentimentBadge sentiment={postData.sentiment} />
            </div>
          </div>
        </div>

        {/* Engagement Timeline Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Engagement Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-400">Comments per Upvote</span>
                <span className="font-medium">
                  {postData.num_comments && postData.score 
                    ? (postData.num_comments / postData.score).toFixed(2) 
                    : 'N/A'}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ 
                    width: postData.upvote_ratio ? `${postData.upvote_ratio * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-400">Upvote Ratio</span>
                <span className="font-medium">
                  {postData.upvote_ratio ? (postData.upvote_ratio * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ 
                    width: postData.upvote_ratio ? `${postData.upvote_ratio * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
            <div>
              {/* <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-400">Controversiality</span>
                <span className="font-medium">
                  {postData.controversiality || 0}
                </span>
              </div> */}
              {/* <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ 
                    width: postData.controversiality ? `${postData.controversiality * 10}%` : '0%'
                  }}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Post Content Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Post Content</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Title</h4>
            <p className="text-lg font-semibold">{postData.title}</p>
          </div>
          {postData.selftext && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Content</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {postData.selftext.length > 500 
                  ? `${postData.selftext.substring(0, 500)}...` 
                  : postData.selftext
                }
              </p>
              {postData.selftext.length > 500 && (
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2">
                  Read more
                </button>
              )}
            </div>
          )}
          {postData.url && !postData.url.includes('reddit.com') && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">External Link</h4>
              <a 
                href={postData.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
              >
                {postData.url}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------------- MAIN COMPONENT ---------------------- */
export default function RedditAnalyticsHome() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [responseMessage, setResponseMessage] = useState("");

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentRedditSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Save recent searches to localStorage

  const saveToRecentSearches = (url, data) => {
          const newSearch = {
            url,
            subreddit: data.subreddit,
            title: data.title,
            timestamp: new Date().toISOString()
          };

          const updatedSearches = [
            newSearch,
            ...recentSearches.filter(search => search.url !== url)
          ].slice(0, 5);

          setRecentSearches(updatedSearches);
          localStorage.setItem('recentRedditSearches', JSON.stringify(updatedSearches));
        };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setResponseMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/reddit/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const response = await res.json();
      console.log("BACKEND RESPONSE:", response);

      if (response.success && response.data) {
        const backend = response.data;

        // ⭐ NORMALIZE BACKEND → UI FORMAT
                const normalized = {
          postId: backend.postId,
          title: backend.title,
          subreddit: backend.subreddit,
          author: backend.author,

          // 🔧 Engagement → match DB shape
          upvotes: backend.upvotes ?? 0,
          num_comments: backend.comments ?? 0,
          score: backend.score ?? 0,
          upvote_ratio: backend.upvote_ratio ?? 0,
          total_awards_received: backend.awards ?? 0,

          // 🔧 Metadata
          created_utc: backend.created
            ? new Date(backend.created).getTime() / 1000
            : null,
          url: backend.url,
          domain: backend.domain,
          thumbnail: backend.thumbnail,
          is_video: backend.is_video,

          // 🔧 Sentiment
          sentiment: backend.sentiment || { score: 0, sentiment: "Neutral" },

          message: response.message,
          warning: response.warning
        };


        // Store normalized output
        setAnalysis(normalized);
        setResponseMessage(response.message);
        saveToRecentSearches(url, normalized);


      } else {
        setError(response.error || response.message || "Failed to fetch analytics.");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Server connection failed. Make sure backend is running.");
    }

    setLoading(false);
  };


  const handleRecentSearchClick = (searchUrl) => {
    setUrl(searchUrl);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="font-bold text-xl text-white">R</span>
            </div>
            <div className="leading-tight">
              <h1 className="font-bold tracking-tight text-xl sm:text-2xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                RedditTrack
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Advanced Reddit Analytics Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aadiakshat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Reddit Post <span className="text-orange-500">Analytics</span> & Insights
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Paste any Reddit post URL to get detailed analytics, engagement metrics, sentiment analysis, and subreddit insights.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT SIDE - INPUT & RECENT SEARCHES */}
          <div className="lg:col-span-1 space-y-6">
            {/* INPUT FORM */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Analyze Post</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Reddit Post URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.reddit.com/r/subreddit/comments/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={18} />
                      Get Analytics
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* RECENT SEARCHES */}
            {recentSearches.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Recent Searches</h2>
                <div className="space-y-3">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search.url)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          r/{search.subreddit}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(search.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {search.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* INFO BOX */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                How it works
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Paste any Reddit post URL
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Get detailed engagement analytics
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  View sentiment analysis and trends
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Compare performance metrics
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE - RESULTS */}
          <div className="lg:col-span-2">

            {/* LOADING STATE */}
            {loading && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  Fetching post data and analyzing...
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!analysis && !loading && !error && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <TrendingUp className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">No analysis yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Enter a Reddit post URL to see detailed analytics
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <span>Try:</span>
                  <button
                    onClick={() => setUrl("https://www.reddit.com/r/IndiaCricket/comments/1mzn7if/hello_reddit_im_sachin_tendulkar_here_for_an_ama/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button")}
                    className="text-orange-500 hover:text-orange-600 hover:underline"
                  >
                    Example post
                  </button>
                </div>
              </div>
            )}

            {/* ANALYSIS RESULTS */}
            {analysis && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Post Analytics</h2>
                    {analysis.postId && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Post ID: {analysis.postId}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setAnalysis(null);
                      setUrl("");
                      setResponseMessage("");
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <AnalyticsDashboard analysis={analysis} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
                  <span className="font-bold text-white">R</span>
                </div>
                <span className="font-bold">RedditTrack</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Advanced analytics for Reddit posts
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} RedditTrack. Not affiliated with Reddit Inc.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}