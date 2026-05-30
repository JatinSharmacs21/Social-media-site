import React from "react";
import Avatar from "../ui/Avatar";
import { formatWhisperTime, getOtherParticipant } from "../../utils/whisperHelpers";

function WhisperConversationItem({ conversation, activeId, currentUserId, onOpenConversation }) {
  const person = getOtherParticipant(conversation, currentUserId);
  const active = conversation._id === activeId;
  const unread = Number(conversation.unreadCount || 0);
  const lastText = conversation.lastMessage?.text || `@${person?.username || "user"}`;

  return (
    <button
      onClick={() => onOpenConversation(conversation)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] border px-3 py-2.5 text-left transition duration-200 active:scale-[0.99] ${
        active
          ? "border-pink-400/35 bg-gradient-to-r from-pink-500/16 via-purple-500/10 to-cyan-500/8 shadow-lg shadow-pink-500/10"
          : "border-white/[0.045] bg-white/[0.032] hover:border-white/10 hover:bg-white/[0.06]"
      }`}
      type="button"
    >
      {active && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-pink-400 to-cyan-300" />}

      <div className="relative shrink-0">
        <Avatar src={person?.profilePic} name={person?.name || person?.username} size="lg" />
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-400 shadow-lg shadow-emerald-400/30" />
      </div>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-black text-white">{person?.name || person?.username || "Vybeo user"}</span>
          <span className={`shrink-0 text-[10px] font-black ${unread ? "text-pink-200" : "text-zinc-600"}`}>
            {formatWhisperTime(conversation.lastMessageAt)}
          </span>
        </span>
        <span className={`mt-1 block truncate text-xs leading-relaxed ${unread ? "font-bold text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"}`}>
          {lastText}
        </span>
      </span>

      {unread > 0 && (
        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 px-1.5 text-xs font-black text-white shadow-lg shadow-pink-500/30">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

export default WhisperConversationItem;
