import {
  MessageCircle,
  ThumbsUp,
  Award,
  Calendar,
  User,
  Hash,
  Activity
} from "lucide-react";

import StatCard from "./Statcard";
import SentimentBadge from "./SentimentBadge";

export default function AnalyticsDashboard({ analysis }) {
  if (!analysis) return null;

  const {
    title,
    subreddit,
    author,
    upvotes,
    num_comments,
    score,
    total_awards_received,
    created_utc,
    domain,
    sentiment
  } = analysis;

  const date = created_utc
    ? new Date(created_utc * 1000).toLocaleString()
    : "Unknown";

  return (
    <div className="space-y-6">
      {/* POST HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Hash size={14} /> r/{subreddit}
          </span>
          <span className="flex items-center gap-1">
            <User size={14} /> u/{author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {date}
          </span>
          <span className="flex items-center gap-1">
            <Activity size={14} /> {domain}
          </span>
        </div>

        <div className="mt-4">
          <SentimentBadge sentiment={sentiment} />
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ThumbsUp}
          label="Upvotes"
          value={upvotes}
        />
        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={num_comments}
        />
        <StatCard
          icon={Activity}
          label="Score"
          value={score}
        />
        <StatCard
          icon={Award}
          label="Awards"
          value={total_awards_received}
        />
      </div>
    </div>
  );
}
