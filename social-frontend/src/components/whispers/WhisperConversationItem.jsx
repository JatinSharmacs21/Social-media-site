import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import { formatWhisperTime, getDisplayMessageText, getOtherParticipant } from "../../utils/whisperHelpers";
import { formatWhisperLastSeen } from "../../utils/whisperPresence";

function WhisperConversationItem({ conversation, activeId, currentUserId, deletingConversation, onlineUserIds = [], onOpenConversation, onDeleteConversation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const person = getOtherParticipant(conversation, currentUserId);
  const active = conversation._id === activeId;
  const unread = Number(conversation.unreadCount || 0);
  const isOnline = Boolean(person?._id && onlineUserIds.map(String).includes(String(person._id)));
  const lastText = conversation.lastMessage?.text
    ? getDisplayMessageText(conversation.lastMessage, currentUserId)
    : isOnline
    ? "Online now"
    : formatWhisperLastSeen(person?.lastSeen);

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
            ? "border-pink-200/18 bg-white/[0.065] shadow-lg shadow-black/18"
            : unread
            ? "border-white/[0.075] bg-white/[0.045] shadow-md shadow-black/10 hover:border-white/[0.11] hover:bg-white/[0.06]"
            : "border-white/[0.045] bg-white/[0.024] hover:border-white/[0.085] hover:bg-white/[0.045]"
        }`}
        type="button"
      >
        {active && <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-pink-300 via-violet-300 to-cyan-300" />}

        <div className={`relative shrink-0 rounded-full p-[2px] ${unread || active ? "bg-gradient-to-br from-pink-400/38 via-violet-400/30 to-cyan-300/30" : "bg-white/[0.075]"}`}>
          <Avatar src={person?.profilePic} name={person?.name || person?.username} size="lg" />
          {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#08080c] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.46)]" />}
        </div>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={`truncate text-[14px] text-white ${unread ? "font-semibold" : "font-medium"}`}>{person?.name || person?.username || "Vybeo user"}</span>
            <span className={`shrink-0 text-[10px] font-semibold ${unread ? "text-pink-100" : "text-zinc-600"}`}>
              {formatWhisperTime(conversation.lastMessageAt)}
            </span>
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2">
            <span className={`block min-w-0 flex-1 truncate text-xs leading-relaxed ${unread ? "font-semibold text-zinc-100" : "font-medium text-zinc-500 group-hover:text-zinc-400"}`}>
              {lastText}
            </span>
            {unread > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(249,168,212,0.55)]" />}
          </span>
        </span>

        {unread > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-300 px-1.5 text-[10px] font-bold text-black shadow-lg shadow-pink-950/25">
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
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-600 transition hover:bg-white/[0.07] hover:text-white"
        aria-label="Chat options"
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-20 cursor-default bg-transparent" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-12 z-30 w-44 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0b10]/98 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
            <button
              type="button"
              disabled={deletingConversation}
              onClick={handleDelete}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/12 disabled:opacity-50"
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
