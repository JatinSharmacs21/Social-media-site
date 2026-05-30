import React from "react";
import Avatar from "../ui/Avatar";

function WhisperChatHeader({ activePerson, typingUser, onBack }) {
  const title = activePerson?.name || activePerson?.username || "Vybeo user";

  return (
    <div className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-[#050508]/88 px-3 py-3 shadow-xl shadow-black/30 backdrop-blur-2xl md:px-5 md:py-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-2xl font-black leading-none text-white transition active:scale-95 md:hidden"
          aria-label="Back to whispers"
        >
          ‹
        </button>

        <div className="relative shrink-0">
          <Avatar src={activePerson?.profilePic} name={title} size="lg" />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#050508] bg-emerald-400 shadow-lg shadow-emerald-400/30" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-black leading-tight text-white md:text-lg">{title}</h2>
          <p className={`truncate text-xs font-bold ${typingUser ? "text-emerald-300" : "text-zinc-500"}`}>
            {typingUser ? "typing..." : `@${activePerson?.username || "vybeo"} • online`}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-black text-zinc-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/30" /> 1:1
        </div>
      </div>
    </div>
  );
}

export default WhisperChatHeader;
