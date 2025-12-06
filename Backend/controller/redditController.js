const axios = require("axios");
const Sentiment = require("sentiment");
const NodeCache = require("node-cache");
const rateLimit = require("axios-rate-limit");
const { URL } = require("url");

const {
  RedditPost,
  RedditUser,
  SubredditInfo
} = require("../models/redditData.js");

const sentiment = new Sentiment();
const cache = new NodeCache({ stdTTL: 300 });

const http = rateLimit(axios.create(), {
  maxRequests: 10,
  perMilliseconds: 60000,
  maxRPS: 1
});

class RedditAPI {
  static async fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await http.get(url, {
          headers: {
            "User-Agent": "YourApp/1.0 (by YourUsername)",
            "Accept": "application/json"
          },
          timeout: 10000
        });
        return response.data;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
}

function extractPostId(url) {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/');
    const commentsIndex = pathSegments.indexOf('comments');
    if (commentsIndex !== -1 && pathSegments[commentsIndex + 1]) {
      return pathSegments[commentsIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function calculateEngagementScore(ups, comments, subredditSubscribers) {
  if (!subredditSubscribers || subredditSubscribers === 0) return 0;
  const upvoteRatio = ups / subredditSubscribers;
  const commentRatio = comments / subredditSubscribers;
  return Math.min(100, Math.round((upvoteRatio * 70 + commentRatio * 30) * 100));
}

exports.fetchPostAnalytics = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: "Valid URL is required",
        code: "INVALID_INPUT"
      });
    }

    const postId = extractPostId(url);
    if (!postId) {
      return res.status(400).json({ 
        error: "Invalid Reddit URL format",
        code: "INVALID_URL_FORMAT"
      });
    }

    const cacheKey = `post:${postId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: "Post analytics fetched from cache",
        data: cachedData,
        cached: true
      });
    }

    console.log(`Fetching Post: ${postId}`);

    const redditApiUrl = `https://www.reddit.com/comments/${postId}.json?limit=1`;
    
    const [postData, embedData] = await Promise.allSettled([
      RedditAPI.fetchWithRetry(redditApiUrl),
      RedditAPI.fetchWithRetry(`https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`)
    ]);

    let postInfo = {};
    let embed = {};

    if (postData.status === 'fulfilled' && postData.value?.[0]?.data?.children?.[0]?.data) {
      const post = postData.value[0].data.children[0].data;
      postInfo = {
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        ups: post.ups,
        upvote_ratio: post.upvote_ratio,
        total_awards_received: post.total_awards_received,
        created: post.created_utc,
        num_comments: post.num_comments,
        is_video: post.is_video,
        domain: post.domain,
        url: post.url
      };
    }

    if (embedData.status === 'fulfilled') {
      embed = embedData.value;
    }

    let comments = [];
    let commentSentiment = 0;
    
    try {
      const pushshiftURL = `https://api.pushshift.io/reddit/comment/search?link_id=${postId}&limit=100`;
      const pushshiftRes = await axios.get(pushshiftURL, { timeout: 8000 });
      comments = pushshiftRes.data?.data || [];
      
      if (comments.length > 0) {
        const commentTexts = comments.map(c => c.body).join(' ');
        commentSentiment = sentiment.analyze(commentTexts).score;
      }
    } catch (err) {}

    const title = postInfo.title || embed.title || "";
    const titleSentiment = sentiment.analyze(title);
    
    const totalSentiment = Math.round(
      (titleSentiment.score * 0.6 + commentSentiment * 0.4) * 10
    ) / 10;

    const ups = postInfo.ups || Math.max(1, titleSentiment.score * 20);
    const totalComments = postInfo.num_comments || comments.length || 0;

    let engagementScore = 0;
    if (postInfo.subreddit) {
      try {
        const subredditUrl = `https://www.reddit.com/r/${postInfo.subreddit}/about.json`;
        const subData = await RedditAPI.fetchWithRetry(subredditUrl);
        const subscribers = subData?.data?.subscribers || 0;
        engagementScore = calculateEngagementScore(ups, totalComments, subscribers);
      } catch (err) {}
    }

    const analytics = {
      postId,
      title,
      author: postInfo.author || embed.author_name || "Unknown",
      subreddit: postInfo.subreddit || embed.provider_name || "Reddit",
      sentiment: {
        score: totalSentiment,
        comparative: titleSentiment.comparative,
        titleScore: titleSentiment.score,
        commentScore: commentSentiment,
        category: totalSentiment > 2 ? "Positive" : 
                 totalSentiment < -2 ? "Negative" : "Neutral"
      },
      engagement: {
        upvotes: ups,
        upvote_ratio: postInfo.upvote_ratio || 0.95,
        comments: totalComments,
        awards: postInfo.total_awards_received || 0,
        score: engagementScore,
        comments_per_upvote: ups > 0 ? (totalComments / ups).toFixed(2) : 0
      },
      metadata: {
        created: postInfo.created ? new Date(postInfo.created * 1000) : new Date(),
        is_video: postInfo.is_video || false,
        domain: postInfo.domain || "self",
        thumbnail: embed.thumbnail_url || null,
        url: postInfo.url || url
      },
      analytics_timestamp: new Date()
    };

    try {
      const saved = await RedditPost.findOneAndUpdate(
        { postId },
        analytics,
        { 
          new: true, 
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      cache.set(cacheKey, saved);

      return res.json({
        success: true,
        message: "Post analytics fetched successfully",
        data: saved,
        cached: false
      });
    } catch (dbErr) {
      return res.json({
        success: true,
        message: "Analytics fetched (not saved to DB)",
        data: analytics,
        warning: "Database save failed"
      });
    }

  } catch (err) {
    const statusCode = err.response?.status || 500;
    return res.status(statusCode).json({ 
      error: "Failed to fetch post analytics",
      code: "API_ERROR"
    });
  }
};

exports.getUserAnalytics = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        error: "Invalid username format",
        code: "INVALID_USERNAME"
      });
    }

    const cacheKey = `user:${username}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: "User analytics fetched from cache",
        data: cachedData,
        cached: true
      });
    }

    const [aboutData, overviewData] = await Promise.allSettled([
      RedditAPI.fetchWithRetry(`https://www.reddit.com/user/${username}/about.json`),
      RedditAPI.fetchWithRetry(`https://www.reddit.com/user/${username}/overview.json?limit=5`)
    ]);

    if (aboutData.status === 'rejected') {
      throw new Error("User not found or API error");
    }

    const u = aboutData.value.data;
    
    let recentActivity = [];
    let avgPostSentiment = 0;
    
    if (overviewData.status === 'fulfilled') {
      const posts = overviewData.value.data?.children || [];
      recentActivity = posts.map(post => ({
        id: post.data.id,
        title: post.data.title,
        subreddit: post.data.subreddit,
        score: post.data.score,
        created: post.data.created_utc
      }));
      
      if (posts.length > 0) {
        const sentiments = posts.map(post => 
          sentiment.analyze(post.data.title || "").score
        );
        avgPostSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      }
    }

    const userAnalytics = {
      username: u.name,
      account_age_days: Math.floor((Date.now() / 1000 - u.created_utc) / 86400),
      karma: {
        total: u.total_karma,
        post: u.link_karma,
        comment: u.comment_karma,
        awardee: u.awardee_karma || 0,
        awarder: u.awarder_karma || 0
      },
      profile: {
        created: new Date(u.created_utc * 1000),
        is_employee: u.is_employee || false,
        is_gold: u.is_gold || false,
        is_mod: u.is_mod || false,
        verified: u.verified || false,
        icon: u.icon_img,
        banner: u.subreddit?.banner_img || null
      },
      activity: {
        recent_posts: recentActivity.length,
        avg_post_sentiment: Math.round(avgPostSentiment * 10) / 10,
        last_active: recentActivity[0]?.created || u.created_utc
      },
      metadata: {
        pref_nsfw: u.pref_nsfw || false,
        pref_autoplay: u.pref_autoplay || false,
        has_subscribed: u.has_subscribed || false,
        analytics_timestamp: new Date()
      }
    };

    const saved = await RedditUser.findOneAndUpdate(
      { username: u.name },
      userAnalytics,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    cache.set(cacheKey, saved);

    res.json({
      success: true,
      message: "User analytics fetched successfully",
      data: saved,
      cached: false
    });

  } catch (err) {
    const statusCode = err.response?.status === 404 ? 404 : 500;
    res.status(statusCode).json({ 
      error: err.response?.status === 404 ? "User not found" : "Failed to fetch user analytics",
      code: err.response?.status === 404 ? "USER_NOT_FOUND" : "API_ERROR"
    });
  }
};

exports.getSubredditAnalytics = async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name || !/^[a-zA-Z0-9_]{1,21}$/.test(name)) {
      return res.status(400).json({ 
        error: "Invalid subreddit name",
        code: "INVALID_SUBREDDIT_NAME"
      });
    }

    const cacheKey = `subreddit:${name}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: "Subreddit analytics fetched from cache",
        data: cachedData,
        cached: true
      });
    }

    const [aboutData, topPosts] = await Promise.allSettled([
      RedditAPI.fetchWithRetry(`https://www.reddit.com/r/${name}/about.json`),
      RedditAPI.fetchWithRetry(`https://www.reddit.com/r/${name}/top.json?limit=5&t=week`)
    ]);

    if (aboutData.status === 'rejected') {
      throw new Error("Subreddit not found or API error");
    }

    const s = aboutData.value.data;
    
    let weeklyActivity = {
      total_upvotes: 0,
      total_comments: 0,
      avg_sentiment: 0
    };
    
    if (topPosts.status === 'fulfilled' && topPosts.value.data?.children) {
      const posts = topPosts.value.data.children;
      const sentiments = [];
      
      posts.forEach(post => {
        weeklyActivity.total_upvotes += post.data.score || 0;
        weeklyActivity.total_comments += post.data.num_comments || 0;
        sentiments.push(sentiment.analyze(post.data.title || "").score);
      });
      
      if (sentiments.length > 0) {
        weeklyActivity.avg_sentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      }
    }

    const subredditAnalytics = {
      name: s.display_name,
      subscribers: s.subscribers,
      active_users: s.active_user_count,
      description: s.public_description,
      rules: s.rules || [],
      category: s.advertiser_category || "General",
      restrictions: {
        over18: s.over18 || false,
        quarantine: s.quarantine || false,
        restrict_posting: s.restrict_posting || false,
        restrict_commenting: s.restrict_commenting || false
      },
      engagement: {
        subscribers_to_active_ratio: s.active_user_count > 0 ? 
          (s.subscribers / s.active_user_count).toFixed(2) : 0,
        weekly_activity: weeklyActivity,
        created: new Date(s.created_utc * 1000)
      },
      media: {
        icon: s.icon_img,
        banner: s.banner_img,
        banner_background_color: s.banner_background_color,
        key_color: s.key_color
      },
      metadata: {
        lang: s.lang || "en",
        whitelist_status: s.whitelist_status || "none",
        submission_type: s.submission_type || "any",
        analytics_timestamp: new Date()
      }
    };

    const saved = await SubredditInfo.findOneAndUpdate(
      { name: s.display_name },
      subredditAnalytics,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    cache.set(cacheKey, saved);

    res.json({
      success: true,
      message: "Subreddit analytics fetched successfully",
      data: saved,
      cached: false
    });

  } catch (err) {
    const statusCode = err.response?.status === 404 ? 404 : 500;
    res.status(statusCode).json({ 
      error: err.response?.status === 404 ? "Subreddit not found" : "Failed to fetch subreddit analytics",
      code: err.response?.status === 404 ? "SUBREDDIT_NOT_FOUND" : "API_ERROR"
    });
  }
};
