import { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ReviewPanel({ postId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;

    const fetchGeminiInsight = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `https://reddit-post-analysis.onrender.com/api/reddit/post/${postId}/gemini`
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch AI insight");
        }

        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGeminiInsight();
  }, [postId]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-semibold">AI Review (Gemini)</h3>
        {data?.cached && (
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            cached
          </span>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating AI insight…
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* CONTENT */}
        {data?.data?.gemini_insight && !loading && (
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            {data.data.gemini_insight
            .split("\n")
            .filter(Boolean)
            .map((line, idx) => (
                <div
                key={idx}
                className="flex items-start gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3"
                >
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                    {line.replace(/^•\s*/, "")}
                </p>
                </div>
            ))}
        </div>
        )}

      {/* FOOTER */}
      {data?.data?.generated_at && (
        <div className="text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          Generated at{" "}
          {new Date(data.data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
