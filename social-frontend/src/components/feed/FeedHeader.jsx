import React from "react";

function FeedHeader({
  moodChips,
  moodMeta,
  activeMood,
  setActiveMood,
  onDailyDrop,
}) {
  return (
    <div className="pt-2.5 sm:pt-0 mb-2.5 sm:mb-6">
      <div className="hidden sm:flex items-center justify-end gap-3 mb-2 sm:mb-3">
        <button
          type="button"
          onClick={onDailyDrop}
          className="inline-flex px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-pink-200 hover:bg-pink-500/10 transition-all"
        >
          Daily Drop
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {moodChips.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setActiveMood(mood)}
            className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border text-[13px] sm:text-sm font-semibold transition-all ${
              activeMood === mood
                ? `bg-gradient-to-r ${moodMeta[mood]?.style} border-white/20 text-white shadow-lg shadow-pink-500/10`
                : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07]"
            }`}
          >
            <span className="mr-1">{moodMeta[mood]?.icon}</span>
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeedHeader;