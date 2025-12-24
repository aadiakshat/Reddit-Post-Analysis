const axios = require("axios");
const vader = require("vader-sentiment");
const NodeCache = require("node-cache");
const rateLimit = require("axios-rate-limit");
const { URL } = require("url");
const RedditPost = require("../models/redditPost.js");

const cache = new NodeCache({ stdTTL: 300 });
const http = rateLimit(axios.create(), {
  maxRequests: 10,
  perMilliseconds: 60000,
  maxRPS: 1
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

class RedditAPI {
  static async fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await http.get(url, {
          headers: {
            "User-Agent": "RedditAnalytics/2.0",
            "Accept": "application/json"
          },
          timeout: 10000
        });
        return response.data;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
}

// VADER sentiment analyzer - optimized for social media
function analyzeSentimentVader(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      compound: 0,
      score: 0,
      pos: 0,
      neu: 1.0,
      neg: 0,
      category: "Neutral",
      confidence: 0
    };
  }

  // Get VADER scores
  const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  
  // Determine category based on compound score
  let category = "Neutral";
  if (scores.compound >= 0.05) {
    category = "Positive";
  } else if (scores.compound <= -0.05) {
    category = "Negative";
  }
  
  return {
    compound: scores.compound,      // -1 to +1
    score: scores.compound,          // Alias for frontend compatibility
    pos: scores.pos,                 // Positive proportion
    neu: scores.neu,                 // Neutral proportion
    neg: scores.neg,                 // Negative proportion
    category: category,
    confidence: Math.abs(scores.compound)
  };
}

// Calculate controversy score
function calculateControversyScore(upvoteRatio, comments, upvotes) {
  if (!upvoteRatio || upvotes < 10) return 0;
  
  const ratioDeviation = Math.abs(0.5 - upvoteRatio);
  const engagementFactor = Math.min(1, comments / Math.max(1, upvotes * 0.1));
  
  return Math.round((1 - ratioDeviation * 2) * engagementFactor * 100);
}

// Calculate virality potential
function calculateViralityScore(ups, comments, awards, ageHours, subredditSize) {
  if (!ups || !ageHours || ageHours === 0) return 0;
  
  const velocity = ups / ageHours;
  const commentRatio = comments / Math.max(1, ups) * 100;
  const awardBoost = Math.min(50, awards * 5);
  const sizeNormalizer = subredditSize > 0 ? Math.log10(subredditSize) / 7 : 1;
  
  const baseScore = (velocity * 0.4 + commentRatio * 0.3 + awardBoost * 0.3) * sizeNormalizer;
  
  return Math.min(100, Math.round(baseScore));
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
  return Math.min(100, Math.round((upvoteRatio * 70 + commentRatio * 30) * 10000));
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
    const redditApiUrl = `https://www.reddit.com/comments/${postId}.json?limit=100`;
    
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
        selftext: post.selftext,
        author: post.author,
        subreddit: post.subreddit,
        ups: post.ups,
        upvote_ratio: post.upvote_ratio,
        total_awards_received: post.total_awards_received,
        created: post.created_utc,
        num_comments: post.num_comments,
        is_video: post.is_video,
        domain: post.domain,
        url: post.url,
        distinguished: post.distinguished,
        stickied: post.stickied,
        link_flair_text: post.link_flair_text,
        over_18: post.over_18
      };
    }

    if (embedData.status === 'fulfilled') {
      embed = embedData.value;
    }

    // Enhanced comment analysis with VADER
    let comments = [];
    let commentSentiments = [];
    let topComments = [];
    
    if (postData.status === 'fulfilled' && postData.value?.[1]?.data?.children) {
      comments = postData.value[1].data.children
        .filter(c => c.kind === 't1' && c.data.body)
        .map(c => c.data);
      
      // Analyze top comments with VADER
      topComments = comments
        .slice(0, 10)
        .map(c => ({
          body: c.body.substring(0, 200),
          score: c.score,
          author: c.author,
          sentiment: analyzeSentimentVader(c.body)
        }));
      
      // Calculate overall comment sentiment
      commentSentiments = comments.map(c => 
        analyzeSentimentVader(c.body).compound
      );
    }

    const title = postInfo.title || embed.title || "";
    const bodyText = postInfo.selftext || "";
    
    // VADER sentiment analysis
    const titleSentiment = analyzeSentimentVader(title);
    const bodySentiment = analyzeSentimentVader(bodyText);
    const avgCommentSentiment = commentSentiments.length > 0
      ? commentSentiments.reduce((a, b) => a + b, 0) / commentSentiments.length
      : 0;
    
    // Weighted overall sentiment (prioritize title and body over comments)
    const overallCompound = titleSentiment.compound * 0.4 + 
                            bodySentiment.compound * 0.3 + 
                            avgCommentSentiment * 0.3;

    // Determine overall category
    let overallCategory = "Neutral";
    if (overallCompound >= 0.05) {
      overallCategory = "Positive";
    } else if (overallCompound <= -0.05) {
      overallCategory = "Negative";
    }

    const ups = postInfo.ups || 0;
    const totalComments = postInfo.num_comments || comments.length || 0;
    const ageHours = postInfo.created 
      ? (Date.now() / 1000 - postInfo.created) / 3600 
      : 0;

    // Fetch subreddit info for advanced metrics
    let engagementScore = 0;
    let controversyScore = 0;
    let viralityScore = 0;
    let subredditSize = 0;

    if (postInfo.subreddit) {
      try {
        const subredditUrl = `https://www.reddit.com/r/${postInfo.subreddit}/about.json`;
        const subData = await RedditAPI.fetchWithRetry(subredditUrl);
        subredditSize = subData?.data?.subscribers || 0;
        
        engagementScore = calculateEngagementScore(ups, totalComments, subredditSize);
        controversyScore = calculateControversyScore(
          postInfo.upvote_ratio, 
          totalComments, 
          ups
        );
        viralityScore = calculateViralityScore(
          ups, 
          totalComments, 
          postInfo.total_awards_received,
          ageHours,
          subredditSize
        );
      } catch (err) {
        console.error("Subreddit fetch error:", err.message);
      }
    }

    const analytics = {
      postId,
      title,
      author: postInfo.author || embed.author_name || "Unknown",
      subreddit: postInfo.subreddit || embed.provider_name || "Reddit",
      selftext: bodyText,
      link_flair_text: postInfo.link_flair_text || null,
      over_18: postInfo.over_18 || false,
      
      // VADER Sentiment data (formatted for your frontend)
      sentiment: {
        compound: Math.round(overallCompound * 100) / 100,
        score: Math.round(overallCompound * 100) / 100,  // Alias for frontend
        label: overallCategory,
        category: overallCategory,
        breakdown: {
          positive: Math.round(titleSentiment.pos * 100) / 100,
          neutral: Math.round(titleSentiment.neu * 100) / 100,
          negative: Math.round(titleSentiment.neg * 100) / 100
        },
        details: {
          title: {
            compound: titleSentiment.compound,
            category: titleSentiment.category,
            pos: titleSentiment.pos,
            neu: titleSentiment.neu,
            neg: titleSentiment.neg
          },
          body: {
            compound: bodySentiment.compound,
            category: bodySentiment.category,
            pos: bodySentiment.pos,
            neu: bodySentiment.neu,
            neg: bodySentiment.neg
          },
          comments: {
            average: Math.round(avgCommentSentiment * 100) / 100,
            total_analyzed: commentSentiments.length,
            distribution: {
              positive: commentSentiments.filter(s => s >= 0.05).length,
              neutral: commentSentiments.filter(s => s > -0.05 && s < 0.05).length,
              negative: commentSentiments.filter(s => s <= -0.05).length
            }
          }
        }
      },
      
      // Engagement metrics
      upvotes: ups,
      comments: totalComments,
      score: ups,
      upvote_ratio: postInfo.upvote_ratio || 0,
      awards: postInfo.total_awards_received || 0,
      
      engagement: {
        upvotes: ups,
        upvote_ratio: postInfo.upvote_ratio || 0,
        comments: totalComments,
        awards: postInfo.total_awards_received || 0,
        score: engagementScore,
        comments_per_upvote: ups > 0 ? parseFloat((totalComments / ups).toFixed(3)) : 0,
        velocity: ageHours > 0 ? Math.round(ups / ageHours) : 0,
        controversy_score: controversyScore,
        virality_score: viralityScore
      },
      
      insights: {
        top_comments: topComments,
        is_controversial: controversyScore > 50,
        is_viral: viralityScore > 70,
        post_quality: Math.round((engagementScore * 0.4 + 
                                 (postInfo.upvote_ratio * 100) * 0.3 + 
                                 (postInfo.total_awards_received * 5) * 0.3)),
        subreddit_size: subredditSize,
        relative_performance: subredditSize > 0 
          ? Math.round((ups / subredditSize) * 100000) / 100
          : 0
      },
      
      // Metadata
      created: postInfo.created ? postInfo.created : Date.now() / 1000,
      url: postInfo.url || url,
      domain: postInfo.domain || "self",
      thumbnail: embed.thumbnail_url || null,
      is_video: postInfo.is_video || false,
      
      metadata: {
        created: postInfo.created ? new Date(postInfo.created * 1000) : new Date(),
        age_hours: Math.round(ageHours * 10) / 10,
        is_video: postInfo.is_video || false,
        is_pinned: postInfo.stickied || false,
        is_distinguished: postInfo.distinguished || false,
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
      console.error("DB SAVE ERROR:", dbErr.message);
      return res.json({
        success: true,
        message: "Analytics fetched (not saved to DB)",
        data: analytics,
        warning: "Database save failed"
      });
    }
  } catch (err) {
    console.error("POST ANALYTICS ERROR:", err.message);
    const statusCode = err.response?.status || 500;
    return res.status(statusCode).json({
      error: "Failed to fetch post analytics",
      code: "API_ERROR",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
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
      RedditAPI.fetchWithRetry(`https://www.reddit.com/user/${username}/overview.json?limit=25`)
    ]);

    if (aboutData.status === 'rejected') {
      throw new Error("User not found or API error");
    }

    const u = aboutData.value.data;
    
    let recentActivity = [];
    let sentimentTrend = [];
    let topSubreddits = {};
    let avgPostSentiment = 0;
    
    if (overviewData.status === 'fulfilled') {
      const posts = overviewData.value.data?.children || [];
      
      recentActivity = posts.map(post => {
        const sentiment = analyzeSentimentVader(post.data.title || post.data.body || "");
        
        const sub = post.data.subreddit;
        topSubreddits[sub] = (topSubreddits[sub] || 0) + 1;
        
        return {
          id: post.data.id,
          type: post.kind === 't1' ? 'comment' : 'post',
          title: post.data.title,
          subreddit: sub,
          score: post.data.score,
          created: post.data.created_utc,
          sentiment: sentiment.category
        };
      });
      
      sentimentTrend = posts.map(post => 
        analyzeSentimentVader(post.data.title || post.data.body || "").compound
      );
      
      if (sentimentTrend.length > 0) {
        avgPostSentiment = sentimentTrend.reduce((a, b) => a + b, 0) / sentimentTrend.length;
      }
    }

    const accountAgeDays = Math.floor((Date.now() / 1000 - u.created_utc) / 86400);
    const karmaPerDay = accountAgeDays > 0 ? Math.round(u.total_karma / accountAgeDays) : 0;

    const userAnalytics = {
      username: u.name,
      account_age_days: accountAgeDays,
      
      karma: {
        total: u.total_karma,
        post: u.link_karma,
        comment: u.comment_karma,
        awardee: u.awardee_karma || 0,
        awarder: u.awarder_karma || 0,
        per_day: karmaPerDay,
        post_to_comment_ratio: u.comment_karma > 0 
          ? parseFloat((u.link_karma / u.comment_karma).toFixed(2))
          : 0
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
        avg_post_sentiment: Math.round(avgPostSentiment * 100) / 100,
        sentiment_category: avgPostSentiment >= 0.05 ? "Positive" : 
                           avgPostSentiment <= -0.05 ? "Negative" : "Neutral",
        top_subreddits: Object.entries(topSubreddits)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, posts: count })),
        last_active: recentActivity[0]?.created 
          ? new Date(recentActivity[0].created * 1000)
          : new Date(u.created_utc * 1000),
        activity_breakdown: {
          posts: recentActivity.filter(a => a.type === 'post').length,
          comments: recentActivity.filter(a => a.type === 'comment').length
        }
      },
      
      metadata: {
        pref_nsfw: u.pref_nsfw || false,
        pref_autoplay: u.pref_autoplay || false,
        has_subscribed: u.has_subscribed || false,
        analytics_timestamp: new Date()
      }
    };

    cache.set(cacheKey, userAnalytics);
    
    res.json({
      success: true,
      message: "User analytics fetched successfully",
      data: userAnalytics,
      cached: false
    });
  } catch (err) {
    console.error("USER ANALYTICS ERROR:", err.message);
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

    const [aboutData, topPosts, newPosts] = await Promise.allSettled([
      RedditAPI.fetchWithRetry(`https://www.reddit.com/r/${name}/about.json`),
      RedditAPI.fetchWithRetry(`https://www.reddit.com/r/${name}/top.json?limit=10&t=week`),
      RedditAPI.fetchWithRetry(`https://www.reddit.com/r/${name}/new.json?limit=10`)
    ]);

    if (aboutData.status === 'rejected') {
      throw new Error("Subreddit not found or API error");
    }

    const s = aboutData.value.data;
    
    let weeklyActivity = {
      total_upvotes: 0,
      total_comments: 0,
      avg_sentiment: 0,
      top_posts: []
    };

    let activityRate = 0;
    
    if (topPosts.status === 'fulfilled' && topPosts.value.data?.children) {
      const posts = topPosts.value.data.children;
      const sentiments = [];
      
      posts.forEach(post => {
        const sentiment = analyzeSentimentVader(post.data.title);
        weeklyActivity.total_upvotes += post.data.score || 0;
        weeklyActivity.total_comments += post.data.num_comments || 0;
        sentiments.push(sentiment.compound);
        
        weeklyActivity.top_posts.push({
          title: post.data.title.substring(0, 100),
          score: post.data.score,
          comments: post.data.num_comments,
          sentiment: sentiment.category
        });
      });
      
      if (sentiments.length > 0) {
        weeklyActivity.avg_sentiment = Math.round(
          (sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100
        ) / 100;
      }
    }

    if (newPosts.status === 'fulfilled' && newPosts.value.data?.children) {
      const posts = newPosts.value.data.children;
      if (posts.length >= 2) {
        const newest = posts[0].data.created_utc;
        const oldest = posts[posts.length - 1].data.created_utc;
        const timespan = (newest - oldest) / 3600;
        activityRate = timespan > 0 ? Math.round((posts.length / timespan) * 10) / 10 : 0;
      }
    }

    const subredditAnalytics = {
      name: s.display_name,
      title: s.title,
      subscribers: s.subscribers,
      active_users: s.active_user_count,
      description: s.public_description,
      
      category: s.advertiser_category || "General",
      
      restrictions: {
        over18: s.over18 || false,
        quarantine: s.quarantine || false,
        restrict_posting: s.restrict_posting || false,
        restrict_commenting: s.restrict_commenting || false
      },
      
      engagement: {
        subscribers_to_active_ratio: s.active_user_count > 0 ? 
          parseFloat((s.subscribers / s.active_user_count).toFixed(2)) : 0,
        activity_rate_posts_per_hour: activityRate,
        weekly_activity: weeklyActivity,
        created: new Date(s.created_utc * 1000),
        age_days: Math.floor((Date.now() / 1000 - s.created_utc) / 86400)
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
        community_icon: s.community_icon,
        analytics_timestamp: new Date()
      }
    };

    cache.set(cacheKey, subredditAnalytics);
    
    res.json({
      success: true,
      message: "Subreddit analytics fetched successfully",
      data: subredditAnalytics,
      cached: false
    });
  } catch (err) {
    console.error("SUBREDDIT ANALYTICS ERROR:", err.message);
    const statusCode = err.response?.status === 404 ? 404 : 500;
    res.status(statusCode).json({ 
      error: err.response?.status === 404 ? "Subreddit not found" : "Failed to fetch subreddit analytics",
      code: err.response?.status === 404 ? "SUBREDDIT_NOT_FOUND" : "API_ERROR"
    });
  }
};
exports.getPostGeminiInsight = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        error: "Post ID required",
        code: "INVALID_INPUT"
      });
    }

    // ✅ Use existing analytics (cheap + fast)
    const post = await RedditPost.findOne({ postId });

    if (!post) {
      return res.status(404).json({
        error: "Post analytics not found",
        code: "POST_NOT_FOUND"
      });
    }

    const prompt = `
You are an expert Reddit content analyst.

Analyze this Reddit post and give:
1. 2-line summary
2. Sentiment interpretation
3. Virality & controversy reasoning
4. One actionable insight

DATA:
Title: ${post.title}
Subreddit: r/${post.subreddit}

Upvotes: ${post.upvotes || 0}
Comments: ${post.comments || 0}
Upvote Ratio: ${post.upvote_ratio || 0}
Awards: ${post.awards || 0}

Sentiment:
Category: ${post.sentiment?.category || "Unknown"}
Score: ${post.sentiment?.compound ?? 0}

Engagement:
Score: ${post.engagement?.score ?? 0}
Virality: ${post.engagement?.virality_score ?? 0}
Controversy: ${post.engagement?.controversy_score ?? 0}

Respond in bullet points.
`;


    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    return res.json({
      success: true,
      data: {
        postId,
        gemini_insight: text,
        generated_at: new Date()
      }
    });

  } catch (err) {
    console.error("GEMINI ERROR:", err.message);
    res.status(500).json({
      error: "Gemini insight generation failed",
      code: "GEMINI_ERROR"
    });
  }
};
