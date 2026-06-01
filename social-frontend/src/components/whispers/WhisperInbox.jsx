import React from "react";
import WhisperConversationItem from "./WhisperConversationItem";
import WhisperSearchBox from "./WhisperSearchBox";

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
  onOpenConversation,
  onStartConversation,
  onDeleteConversation,
}) {
  return (
    <aside className={`min-h-0 flex-col border-white/[0.06] bg-[#06070b]/70 md:flex ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
      <div className="shrink-0 border-b border-white/[0.06] bg-[#07070c]/84 px-4 py-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Whispers</h1>
            <p className="mt-0.5 text-sm font-semibold text-zinc-500">Private conversations</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.075] bg-white/[0.045] text-xl text-pink-100">
            ✦
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] md:px-4 md:py-4 [&::-webkit-scrollbar]:hidden">
        <WhisperSearchBox query={query} setQuery={setQuery} users={users} searching={searching} onStartConversation={onStartConversation} />

        <div className="mb-3 mt-5 flex items-center justify-between px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Inbox</p>
          <p className="rounded-full border border-white/[0.065] bg-white/[0.035] px-2.5 py-1 text-[11px] font-bold text-zinc-500">
            {conversations.length} chats
          </p>
        </div>

        {loading ? (
          <InboxSkeleton />
        ) : emptyState ? (
          <div className="mx-1 mt-8 rounded-[28px] border border-white/[0.065] bg-white/[0.032] p-6 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.055] text-2xl ring-1 ring-white/[0.07]">
              💬
            </div>
            <p className="font-black text-white">No conversations yet</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">Search for someone and start privately.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <WhisperConversationItem
                key={conversation._id}
                conversation={conversation}
                activeId={activeId}
                currentUserId={currentUserId}
                deletingConversation={deletingConversation}
                onOpenConversation={onOpenConversation}
                onDeleteConversation={onDeleteConversation}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default WhisperInbox;
