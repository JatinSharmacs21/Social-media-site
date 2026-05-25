import React from "react";

function FeedEmptyState({ activeFlowTab, onExploreForYou }) {
  const isTunedIn = activeFlowTab === "Tuned In";
  const isCloseCircle = activeFlowTab === "Close Circle";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/85 px-5 py-14 text-center text-gray-400 shadow-xl shadow-black/25 sm:px-8 sm:py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.05] text-3xl shadow-lg shadow-black/20">
          {isTunedIn ? "〰️" : isCloseCircle ? "🫶" : "✨"}
        </div>

        <h2 className="mb-2 text-2xl font-black text-white">
          {isTunedIn ? "No tuned-in vybes yet" : isCloseCircle ? "Your Close Circle is quiet" : "No vybes found"}
        </h2>

        <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-500 sm:text-base">
          {isTunedIn
            ? "Follow more people to build a flow that actually feels like you."
            : isCloseCircle
            ? "Close Circle will be perfect for real moments from trusted people."
            : "Try another mood or drop your first vybe to shape the flow."}
        </p>

        {activeFlowTab !== "For You" && (
          <button type="button" onClick={onExploreForYou} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition-all hover:bg-white/[0.1] active:scale-95">
            Explore For You
          </button>
        )}
      </div>
    </div>
  );
}

export default FeedEmptyState;
