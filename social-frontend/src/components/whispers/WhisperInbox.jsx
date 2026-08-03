import React from "react";
import WhisperConversationItem from "./WhisperConversationItem";
import WhisperSearchBox from "./WhisperSearchBox";
import { isConversationPinned } from "../../utils/whisperHelpers";

function InboxSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-[22px] border border-white/[0.045] bg-white/[0.028] px-3 py-2.5">
          <div className="h-11 w-11 animate-pulse rounded-full bg-white/[0.07]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WhisperInbox({
  conversations,
  loading,
  emptyState,
  mobileChatOpen,
  query,
  setQuery,
  users,
  searching,
  activeId,
  currentUserId,
  deletingConversation,
  onlineUserIds = [],
  onOpenConversation,
  onStartConversation,
  onDeleteConversation,
  onTogglePinConversation,
}) {
  const unreadTotal = conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0);
  const onlineSet = new Set((onlineUserIds || []).map(String));
  const pinnedConversations = conversations.filter((conversation) => isConversationPinned(conversation, currentUserId));
  const normalConversations = conversations.filter((conversation) => !isConversationPinned(conversation, currentUserId));
  const onlineConversations = conversations.filter((conversation) => {
    if (conversation.isBlocked) return false;
    const person = conversation.participants?.find((participant) => String(participant?._id) !== String(currentUserId)) || conversation.participants?.[0];
    return person?._id && onlineSet.has(String(person._id));
  });

  return (
    <aside className={`min-h-0 flex-col border-white/[0.06] bg-[#06070b]/78 md:flex ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
      <div className="shrink-0 border-b border-white/[0.055] bg-[#07070c]/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[24px] font-semibold tracking-tight text-white">Whispers</h1>
            <p className="mt-0.5 text-[12px] font-medium text-zinc-500">Private conversations</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.075] bg-white/[0.04] text-base text-pink-100">
            ✦
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3 [scrollbar-width:none] md:px-4 md:py-4 [&::-webkit-scrollbar]:hidden">
        <WhisperSearchBox query={query} setQuery={setQuery} users={users} searching={searching} onStartConversation={onStartConversation} />

        {onlineConversations.length > 0 && !query.trim() && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {onlineConversations.slice(0, 8).map((conversation) => {
              const person = conversation.participants?.find((participant) => String(participant?._id) !== String(currentUserId)) || conversation.participants?.[0];
              return (
                <button
                  key={conversation._id}
                  onClick={() => onOpenConversation(conversation)}
                  type="button"
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 transition active:scale-[0.98] ${
                    conversation._id === activeId ? "border-pink-200/18 bg-white/[0.065]" : "border-white/[0.055] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="max-w-[88px] truncate text-[11px] font-semibold text-zinc-300">{person?.name || person?.username || "User"}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-2.5 mt-4 flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Inbox</p>
          <p className="rounded-full border border-white/[0.06] bg-white/[0.032] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
            {unreadTotal > 0 ? `${unreadTotal > 99 ? "99+" : unreadTotal} new` : `${conversations.length} chats`}
          </p>
        </div>

        {loading ? (
          <InboxSkeleton />
        ) : emptyState ? (
          <div className="mx-1 mt-8 rounded-[28px] border border-white/[0.065] bg-white/[0.032] p-6 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.055] text-2xl ring-1 ring-white/[0.07]">
              💬
            </div>
            <p className="font-medium text-white">Start a conversation</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">Search someone and send a private Whisper.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {pinnedConversations.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-pink-200/70">Pinned</p>
                {pinnedConversations.map((conversation) => (
                  <WhisperConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    activeId={activeId}
                    currentUserId={currentUserId}
                    deletingConversation={deletingConversation}
                    onOpenConversation={onOpenConversation}
                    onlineUserIds={onlineUserIds}
                    onDeleteConversation={onDeleteConversation}
                    onTogglePinConversation={onTogglePinConversation}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              {pinnedConversations.length > 0 && normalConversations.length > 0 && (
                <p className="px-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Recent</p>
              )}
              {normalConversations.map((conversation) => (
                <WhisperConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  activeId={activeId}
                  currentUserId={currentUserId}
                  deletingConversation={deletingConversation}
                  onOpenConversation={onOpenConversation}
                  onlineUserIds={onlineUserIds}
                  onDeleteConversation={onDeleteConversation}
                  onTogglePinConversation={onTogglePinConversation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default WhisperInbox;