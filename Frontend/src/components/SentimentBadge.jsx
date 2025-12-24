import React from "react";

const SentimentBadge = ({ sentiment }) => {
  // ---------------- NORMALIZE SCORE ----------------
  let score = 0;

  if (typeof sentiment === "number") {
    score = sentiment;
  } else if (sentiment && typeof sentiment === "object") {
    if (typeof sentiment.score === "number") {
      score = sentiment.score;
    } else if (typeof sentiment.compound === "number") {
      score = sentiment.compound;
    }
  }

  // ---------------- DERIVE UI STATE ----------------
  let label = "Neutral";
  let icon = "😐";
  let color =
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";

  if (score >= 0.1) {
    label = "Positive";
    icon = "😊";
    color =
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (score <= -0.1) {
    label = "Negative";
    icon = "😞";
    color =
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  }

  // ---------------- RENDER ----------------
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}
      aria-label={`Sentiment: ${label} (${score.toFixed(2)})`}
      title={`Sentiment score: ${score.toFixed(2)}`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
      <span className="text-xs opacity-80">({score.toFixed(2)})</span>
    </div>
  );
};

export default SentimentBadge;
