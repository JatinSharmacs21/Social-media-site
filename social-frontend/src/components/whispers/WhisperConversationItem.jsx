import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import { formatWhisperTime, getDisplayMessageText, getOtherParticipant } from "../../utils/whisperHelpers";

function WhisperConversationItem({ conversation, activeId, currentUserId, deletingConversation, onOpenConversation, onDeleteConversation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const person = getOtherParticipant(conversation, currentUserId);
  const active = conversation._id === activeId;
  const unread = Number(conversation.unreadCount || 0);
  const lastText = conversation.lastMessage?.text
    ? getDisplayMessageText(conversation.lastMessage, currentUserId)
    : `@${person?.username || "user"}`;

  const handleDelete = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (window.confirm("Delete this chat?")) onDeleteConversation?.(conversation._id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => onOpenConversation(conversation)}
        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] border px-3 py-2.5 pr-10 text-left transition duration-200 active:scale-[0.99] ${
          active
            ? "border-pink-200/16 bg-white/[0.05] shadow-lg shadow-black/18"
            : "border-white/[0.045] bg-white/[0.028] hover:border-white/[0.085] hover:bg-white/[0.047]"
        }`}
        type="button"
      >
        {active && <span className="absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-pink-300 via-violet-300 to-cyan-300" />}

        <div className="relative shrink-0 rounded-full bg-gradient-to-br from-pink-400/38 via-violet-400/32 to-cyan-300/30 p-[2px]">
          <Avatar src={person?.profilePic} name={person?.name || person?.username} size="lg" />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#08080c] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.52)]" />
        </div>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-black text-white">{person?.name || person?.username || "Vybeo user"}</span>
            <span className={`shrink-0 text-[10px] font-black ${unread ? "text-pink-100" : "text-zinc-600"}`}>
              {formatWhisperTime(conversation.lastMessageAt)}
            </span>
          </span>
          <span className={`mt-1 block truncate text-xs leading-relaxed ${unread ? "font-bold text-zinc-100" : "text-zinc-500 group-hover:text-zinc-400"}`}>
            {lastText}
          </span>
        </span>

        {unread > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink-300 px-1.5 text-[11px] font-black text-black shadow-lg shadow-pink-950/25">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((value) => !value);
        }}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
        aria-label="Chat options"
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-20 cursor-default bg-transparent" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-11 z-30 w-44 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0b10]/98 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
            <button
              type="button"
              disabled={deletingConversation}
              onClick={handleDelete}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-200 transition hover:bg-red-500/12 disabled:opacity-50"
            >
              <span>{deletingConversation ? "Deleting..." : "Delete chat"}</span>
              <span className="text-red-300/50">✕</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default WhisperConversationItem;
