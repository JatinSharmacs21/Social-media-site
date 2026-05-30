import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";

function WhisperChatHeader({ activePerson, typingUser, onBack }) {
  const navigate = useNavigate();
  const title = activePerson?.name || activePerson?.username || "Vybeo user";
  const profileTarget = activePerson?._id || activePerson?.username;

  const openProfile = () => {
    if (profileTarget) navigate(`/profile/${profileTarget}`);
  };

  return (
    <div className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-[#050508]/88 bg-[radial-gradient(circle_at_92%_0%,rgba(236,72,153,0.18),transparent_36%)] px-3 py-2 shadow-xl shadow-black/30 backdrop-blur-2xl md:px-5 md:py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl font-black leading-none text-white transition hover:bg-white/[0.1] active:scale-95 md:hidden"
          aria-label="Back to whispers"
        >
          ‹
        </button>

        <button type="button" onClick={openProfile} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative shrink-0">
            <Avatar src={activePerson?.profilePic} name={title} size="md" />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#050508] bg-emerald-400 shadow-lg shadow-emerald-400/30" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-black leading-tight text-white transition group-hover:text-pink-100 md:text-lg">
              {title}
            </span>
            <span className={`block truncate text-xs font-bold ${typingUser ? "text-emerald-300" : "text-zinc-500"}`}>
              {typingUser ? "typing..." : `@${activePerson?.username || "vybeo"} • online`}
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-black text-zinc-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/30" /> 1:1
        </div>
      </div>
    </div>
  );
}

export default WhisperChatHeader;
