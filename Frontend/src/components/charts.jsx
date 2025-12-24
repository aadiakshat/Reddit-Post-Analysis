import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from "recharts";

import {
   TrendingUp,TrendingDown,
   ThumbsUp, Activity,
  Award,
   BarChart3,
  Zap, Minus, Target
} from 'lucide-react';

/* ---------------------- ENGAGEMENT CHART ---------------------- */
export const EngagementChart = ({ analysis }) => {
  if (!analysis) return null;

  const data = [
    { name: "Upvotes", value: analysis.upvotes || 0, fill: "#22c55e" },
    { name: "Comments", value: analysis.num_comments || 0, fill: "#3b82f6" },
    {
      name: "Awards",
      value: (analysis.total_awards_received || 0) * 10,
      fill: "#f59e0b"
    }
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 size={18} />
        Engagement Distribution
      </h3>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


/* ---------------------- SENTIMENT PIE CHART ---------------------- */
export const SentimentPieChart = ({ analysis }) => {
  if (!analysis) return null;

  const breakdown = analysis.sentiment?.breakdown || {
    positive: 0.33,
    neutral: 0.34,
    negative: 0.33
  };

  const data = [
    { name: "Positive", value: Math.round(breakdown.positive * 100), fill: "#22c55e" },
    { name: "Neutral", value: Math.round(breakdown.neutral * 100), fill: "#eab308" },
    { name: "Negative", value: Math.round(breakdown.negative * 100), fill: "#ef4444" }
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity size={18} />
        Sentiment Breakdown
      </h3>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


/* ---------------------- ENGAGEMENT TIMELINE ---------------------- */
export const EngagementTimeline = ({ analysis }) => {
    if (!analysis) return null;
    if (!analysis.created_utc) return null;
    const createdDate = new Date(analysis.created_utc * 1000);

  const now = new Date();
  const hoursSince = Math.floor((now - createdDate) / (1000 * 60 * 60));
  
  // Simulate engagement over time (in a real app, you'd get this from historical data)
  const data = Array.from({ length: Math.min(24, hoursSince + 1) }, (_, i) => {
    const hour = i;
    const growthFactor =hoursSince > 0 ? Math.min(1, i / hoursSince) : 1;
    return {
      hour: `${i}h`,
      upvotes: Math.round(analysis.upvotes * growthFactor * (0.7 + Math.random() * 0.3)),
      comments: Math.round(analysis.num_comments * growthFactor * (0.7 + Math.random() * 0.3))
    };
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} />
        Estimated Growth Timeline
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUpvotes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Area
            type="monotone"
            dataKey="upvotes"
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#colorUpvotes)"
          />
          <Area
            type="monotone"
            dataKey="comments"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorComments)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">Upvotes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">Comments</span>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- QUICK INSIGHTS CARDS ---------------------- */
export const QuickInsights = ({ analysis }) => {
    if (!analysis) return null;
  const engagementRate = analysis.upvotes > 0 ? (analysis.num_comments / analysis.upvotes * 100).toFixed(1) : 0;
  const sentimentScore = analysis.sentiment?.score || 0;
  const viralityScore = analysis.upvotes > 1000 ? 'High' : analysis.upvotes > 100 ? 'Medium' : 'Low';
  
  const insights = [
    {
      icon: engagementRate > 10 ? TrendingUp : engagementRate > 5 ? Minus : TrendingDown,
      color: engagementRate > 10 ? 'text-green-600' : engagementRate > 5 ? 'text-yellow-600' : 'text-red-600',
      bgColor: engagementRate > 10 ? 'bg-green-100 dark:bg-green-900/20' : engagementRate > 5 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20',
      label: 'Engagement Rate',
      value: `${engagementRate}%`,
      description: engagementRate > 10 ? 'Excellent discussion' : engagementRate > 5 ? 'Good engagement' : 'Low engagement'
    },
    {
      icon: sentimentScore > 0.1 ? ThumbsUp : sentimentScore < -0.1 ? TrendingDown : Minus,
      color: sentimentScore > 0.1 ? 'text-green-600' : sentimentScore < -0.1 ? 'text-red-600' : 'text-yellow-600',
      bgColor: sentimentScore > 0.1 ? 'bg-green-100 dark:bg-green-900/20' : sentimentScore < -0.1 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20',
      label: 'Sentiment',
      value: analysis.sentiment?.sentiment || "Neutral",
      description: `Score: ${sentimentScore.toFixed(2)}`
    },
    {
      icon: Zap,
      color: viralityScore === 'High' ? 'text-purple-600' : viralityScore === 'Medium' ? 'text-blue-600' : 'text-slate-600',
      bgColor: viralityScore === 'High' ? 'bg-purple-100 dark:bg-purple-900/20' : viralityScore === 'Medium' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-slate-100 dark:bg-slate-800',
      label: 'Virality',
      value: viralityScore,
      description: `${analysis.upvotes} upvotes`
    },
    {
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      label: 'Awards',
      value: analysis.total_awards_received || 0,
      description: analysis.total_awards_received > 0 ? 'Well received!' : 'No awards yet'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {insights.map((insight, idx) => (
        <div key={idx} className={`rounded-xl p-4 border border-slate-200 dark:border-slate-700 ${insight.bgColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <insight.icon size={20} className={insight.color} />
          </div>
          <p className="text-2xl font-bold mb-1">{insight.value}</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{insight.label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{insight.description}</p>
        </div>
      ))}
    </div>
  );
};
export const PerformanceRadar = ({ analysis }) => {
  if (!analysis) return null;

  const data = [
    {
      metric: "Upvotes",
      value: Math.min(100, ((analysis.upvotes || 0) / 10000) * 100)
    },
    {
      metric: "Comments",
      value: Math.min(100, ((analysis.num_comments || 0) / 1000) * 100)
    },
    {
      metric: "Awards",
      value: Math.min(
        100,
        ((analysis.total_awards_received || 0) / 50) * 100
      )
    },
    {
      metric: "Upvote Ratio",
      value: Math.min(100, (analysis.upvote_ratio || 0) * 100)
    },
    {
      metric: "Sentiment",
      value: Math.min(100, ((analysis.sentiment?.score || 0) + 1) * 50)
    }
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target size={18} />
        Performance Radar
      </h3>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
