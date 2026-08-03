import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import { formatWhisperTime, getDisplayMessageText, getOtherParticipant, isConversationPinned } from "../../utils/whisperHelpers";
import { formatWhisperLastSeen } from "../../utils/whisperPresence";

function DeleteChatDialog({ deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/72 px-4 backdrop-blur-xl">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0b0c12]/88 p-2 shadow-2xl shadow-black/90 backdrop-blur-3xl">
        <div className="rounded-[22px] border border-red-300/15 bg-gradient-to-br from-red-500/18 via-white/[0.055] to-white/[0.025] px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-300/15 bg-red-500/12 text-lg text-red-100 shadow-lg shadow-red-950/25">
              ✕
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white">Delete this chat?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">This conversation will be removed from your whispers list.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.055] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="rounded-2xl border border-red-300/20 bg-red-500/18 px-4 py-3 text-sm font-semibold text-red-100 shadow-lg shadow-red-950/20 transition hover:bg-red-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhisperConversationItem({ conversation, activeId, currentUserId, deletingConversation, onlineUserIds = [], onOpenConversation, onDeleteConversation, onTogglePinConversation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const person = getOtherParticipant(conversation, currentUserId);
  const active = conversation._id === activeId;
  const unread = Number(conversation.unreadCount || 0);
  const pinned = isConversationPinned(conversation, currentUserId);
  const isBlocked = Boolean(conversation.isBlocked);
  const isOnline = !isBlocked && Boolean(person?._id && onlineUserIds.map(String).includes(String(person._id)));
  const lastText = isBlocked
    ? "Blocked"
    : conversation.lastMessage?.text
    ? getDisplayMessageText(conversation.lastMessage, currentUserId)
    : isOnline
    ? "Online now"
    : formatWhisperLastSeen(person?.lastSeen);

  const openDeleteConfirm = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    onDeleteConversation?.(conversation._id);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="relative">
      {deleteConfirmOpen && (
        <DeleteChatDialog
          deleting={deletingConversation}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      )}

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
        {pinned && <span className="absolute right-9 top-2 text-[11px] text-pink-200/80">📌</span>}

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
            <span className={`block min-w-0 flex-1 truncate text-xs leading-relaxed ${isBlocked ? "font-semibold text-red-300/70" : unread ? "font-semibold text-zinc-100" : "font-medium text-zinc-500 group-hover:text-zinc-400"}`}>
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
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-white/[0.14] bg-[#15131c] p-1.5 shadow-2xl shadow-black/70 ring-1 ring-white/[0.06]">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onTogglePinConversation?.(conversation._id);
              }}
              className="mb-1 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.06] px-3 py-2.5 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.1]"
            >
              <span>{pinned ? "Unpin chat" : "Pin chat"}</span>
              <span className="text-pink-200/80">📌</span>
            </button>
            <button
              type="button"
              disabled={deletingConversation}
              onClick={openDeleteConfirm}
              className="flex w-full items-center justify-between rounded-xl border border-red-300/15 bg-red-500/[0.12] px-3 py-2.5 text-left text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <span>{deletingConversation ? "Deleting..." : "Delete chat"}</span>
              <span className="text-red-300/60">✕</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default WhisperConversationItem;