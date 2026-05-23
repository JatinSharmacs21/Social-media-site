import React from "react";

function FeedEmptyState({ activeFlowTab, onExploreForYou }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">
        {activeFlowTab === "Tuned In" ? "〰️" : activeFlowTab === "Close Circle" ? "🫶" : "✨"}
      </div>

      <h2 className="text-2xl font-black mb-2">
        {activeFlowTab === "Tuned In"
          ? "No tuned-in vybes yet"
          : activeFlowTab === "Close Circle"
          ? "Your Close Circle is quiet"
          : "No Vybes Found"}
      </h2>

      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
        {activeFlowTab === "Tuned In"
          ? "Follow more people to build a Flow that feels like you."
          : activeFlowTab === "Close Circle"
          ? "Add people to Close Circle later and their real moments will show here."
          : "Try another mood or drop your first vybe to shape your Flow."}
      </p>

      {activeFlowTab !== "For You" && (
        <button
          type="button"
          onClick={onExploreForYou}
          className="mt-6 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-black text-white hover:bg-white/[0.1] transition-all"
        >
          Explore For You
        </button>
      )}
    </div>
  );
}

export default FeedEmptyState;
