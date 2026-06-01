import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";

function WhisperChatHeader({ activePerson, typingUser, deletingConversation, onBack, onDeleteConversation }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = activePerson?.name || activePerson?.username || "Vybeo user";
  const profileTarget = activePerson?._id || activePerson?.username;

  const openProfile = () => {
    setMenuOpen(false);
    if (profileTarget) navigate(`/profile/${profileTarget}`);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm("Delete this chat?")) onDeleteConversation?.();
  };

  return (
    <div className="relative z-40 shrink-0 border-b border-white/[0.06] bg-[#07070c]/94 px-3 py-2.5 shadow-xl shadow-black/25 backdrop-blur-2xl md:px-5 md:py-3">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[3px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="relative z-50 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.055] text-2xl font-black leading-none text-white shadow-lg shadow-black/20 transition hover:bg-white/[0.09] active:scale-95 md:hidden"
          aria-label="Back to whispers"
        >
          ‹
        </button>

        <button type="button" onClick={openProfile} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="relative shrink-0 rounded-full bg-gradient-to-br from-pink-400/45 via-violet-400/35 to-cyan-300/35 p-[2px]">
            <Avatar src={activePerson?.profilePic} name={title} size="md" />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#07070c] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-extrabold leading-tight text-white transition group-hover:text-pink-100 md:text-[17px]">
              {title}
            </span>
            <span className={`block truncate text-xs font-semibold ${typingUser ? "text-cyan-200" : "text-zinc-500"}`}>
              {typingUser ? "Typing..." : activePerson?.username ? `@${activePerson.username}` : "Online"}
            </span>
          </span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xl font-black transition active:scale-95 ${
              menuOpen
                ? "border-white/[0.14] bg-white/[0.12] text-white"
                : "border-white/[0.08] bg-white/[0.055] text-zinc-400 hover:bg-white/[0.09] hover:text-white"
            }`}
            aria-label="Chat options"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a0b10]/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-2xl">
              <button
                type="button"
                onClick={openProfile}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-zinc-100 transition hover:bg-white/[0.08]"
              >
                <span>View profile</span>
                <span className="text-zinc-500">›</span>
              </button>
              <button
                type="button"
                disabled={deletingConversation}
                onClick={handleDelete}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                <span>{deletingConversation ? "Deleting..." : "Delete chat"}</span>
                <span className="text-red-300/60">✕</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhisperChatHeader;
