import React from "react";

function FeedHeader({
  moodChips,
  moodMeta,
  activeMood,
  setActiveMood,
  onDailyDrop,
}) {
  return (
    <div className="mb-2.5 sm:mb-6">
      <div className="flex items-end justify-between gap-3 mb-2 sm:mb-3">
        <div>
          <p className="text-[11px] tracking-[0.24em] text-pink-300 font-black mb-1">
            VYBEO
          </p>

          <h1 className="text-[24px] sm:text-[34px] font-black tracking-tight">
            Vybe Flow
          </h1>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-200 text-[10px] sm:text-[11px] font-black tracking-wide">
              REAL THOUGHTS
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDailyDrop}
          className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-semibold text-pink-200 hover:bg-pink-500/10 transition-all"
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