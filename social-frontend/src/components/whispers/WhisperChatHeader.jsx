import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { formatWhisperLastSeen } from "../../utils/whisperPresence";

function WhisperChatHeader({ activePerson, typingUser, onlineUserIds = [], deletingConversation, onBack, onDeleteConversation }) {
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

  const isOnline = Boolean(activePerson?._id && onlineUserIds.map(String).includes(String(activePerson._id)));
  const statusText = typingUser ? "Typing..." : isOnline ? "Online now" : formatWhisperLastSeen(activePerson?.lastSeen);

  return (
    <div className="relative z-30 shrink-0 border-b border-white/[0.07] bg-[#08090d]/92 px-3 py-2 shadow-lg shadow-black/25 backdrop-blur-xl md:px-5 md:py-2.5">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="relative z-50 flex min-h-[44px] items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-[24px] font-normal leading-none text-zinc-100 shadow-sm shadow-black/15 transition hover:bg-white/[0.08] active:scale-95 md:hidden"
          aria-label="Back to whispers"
        >
          ‹
        </button>

        <button type="button" onClick={openProfile} className="group flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className="relative shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] p-[2px] shadow-sm shadow-black/20">
            <Avatar src={activePerson?.profilePic} name={title} size="md" />
            {isOnline && <span className="absolute bottom-[1px] right-[1px] h-2.5 w-2.5 rounded-full border-2 border-[#08090d] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium leading-tight text-white transition group-hover:text-pink-100 md:text-[16px]">
              {title}
            </span>
            <span className={`mt-0.5 block truncate text-[11px] font-medium ${typingUser ? "text-cyan-200" : isOnline ? "text-emerald-300/85" : "text-zinc-500"}`}>
              {statusText}
            </span>
          </span>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg font-medium leading-none transition active:scale-95 ${
              menuOpen
                ? "border-white/[0.14] bg-white/[0.1] text-white"
                : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
            }`}
            aria-label="Chat options"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a0b10]/96 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl">
              <button
                type="button"
                onClick={openProfile}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
              >
                <span>View profile</span>
                <span className="text-zinc-500">›</span>
              </button>
              <button
                type="button"
                disabled={deletingConversation}
                onClick={handleDelete}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
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
