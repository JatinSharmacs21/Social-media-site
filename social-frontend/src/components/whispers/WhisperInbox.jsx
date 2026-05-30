import React from "react";
import WhisperConversationItem from "./WhisperConversationItem";
import WhisperSearchBox from "./WhisperSearchBox";

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
  onOpenConversation,
  onStartConversation,
}) {
  return (
    <aside className={`min-h-0 flex-col border-white/10 bg-black/18 md:flex ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
      <div className="shrink-0 border-b border-white/10 px-4 py-4 md:hidden">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-pink-300">Private Vybes</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Whispers</h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">Private chats, Vybeo style.</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-2xl shadow-xl shadow-black/25">
            ✦
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-4 md:py-4">
        <WhisperSearchBox query={query} setQuery={setQuery} users={users} searching={searching} onStartConversation={onStartConversation} />

        <div className="mb-3 mt-6 flex items-center justify-between px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Inbox</p>
          <p className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] font-bold text-zinc-500">
            {conversations.length} chats
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[74px] animate-pulse rounded-[24px] bg-white/[0.045]" />
            ))}
          </div>
        ) : emptyState ? (
          <div className="mx-1 mt-8 rounded-[30px] border border-dashed border-white/10 bg-white/[0.035] p-6 text-center shadow-xl shadow-black/20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[26px] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-400/20 text-3xl">
              💬
            </div>
            <p className="font-black text-white">No whispers yet</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">Search se kisi user ko choose kar aur first private vybe bhej.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <WhisperConversationItem
                key={conversation._id}
                conversation={conversation}
                activeId={activeId}
                currentUserId={currentUserId}
                onOpenConversation={onOpenConversation}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default WhisperInbox;
