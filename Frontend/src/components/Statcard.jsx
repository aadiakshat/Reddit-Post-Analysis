import React from "react";

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  description,
  large = false,
}) => {
  // -------- FORMAT VALUE SAFELY --------
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value ?? "--";

  // -------- TREND UI --------
  let trendColor =
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  let trendText = "0%";

  if (typeof trend === "number") {
    if (trend > 0) {
      trendColor =
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      trendText = `+${trend}%`;
    } else if (trend < 0) {
      trendColor =
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      trendText = `${trend}%`;
    }
  }

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow
        ${large ? "col-span-2 md:col-span-3 lg:col-span-2" : ""}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Icon
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          </div>
        )}

        {typeof trend === "number" && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${trendColor}`}
          >
            {trendText}
          </span>
        )}
      </div>

      {/* VALUE */}
      <p
        className={`font-bold text-slate-900 dark:text-white mb-1 ${
          large ? "text-3xl" : "text-2xl"
        }`}
      >
        {displayValue}
      </p>

      {/* LABEL */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </p>

      {/* DESCRIPTION */}
      {description && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
