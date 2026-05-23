import React from "react";

function FlowTabs({ flowTabs, activeFlowTab, setActiveFlowTab }) {
  return (
    <div className="sticky top-[8px] md:static z-40 flex items-center gap-1.5 mb-4 sm:mb-5 bg-zinc-950/95 border border-white/10 rounded-[22px] sm:rounded-3xl p-1.5 shadow-lg shadow-black/30 backdrop-blur-2xl pointer-events-auto">
      {flowTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveFlowTab(tab);
          }}
          className={`relative flex-1 px-2.5 py-2 rounded-[15px] text-[12px] sm:text-sm font-black transition-all active:scale-[0.98] ${
            activeFlowTab === tab
              ? "bg-gradient-to-r from-pink-500/25 to-cyan-500/20 border border-pink-400/25 text-white shadow-lg shadow-pink-500/10"
              : "border border-transparent text-gray-500 hover:text-white hover:bg-white/[0.045]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default FlowTabs;
