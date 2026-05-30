import React from "react";
import Avatar from "../ui/Avatar";

function WhisperSearchBox({ query, setQuery, users, searching, onStartConversation }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-2.5 shadow-xl shadow-black/25 backdrop-blur-xl">
      <div className="flex h-12 items-center gap-3 rounded-[18px] border border-white/10 bg-black/38 px-3 transition focus-within:border-pink-400/45 focus-within:bg-black/55">
        <span className="text-base text-zinc-500">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or username"
          className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-zinc-600 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2 py-1 text-xs font-black text-zinc-500 transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-[22px] border border-white/10 bg-black/55 p-2 shadow-2xl shadow-black/40">
          {searching ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/[0.055]" />
              ))}
            </div>
          ) : users.length ? (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => onStartConversation(user)}
                className="group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/[0.07] active:scale-[0.99]"
                type="button"
              >
                <Avatar src={user.profilePic} name={user.name || user.username} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-white">{user.name || user.username}</span>
                  <span className="block truncate text-xs font-medium text-zinc-500">@{user.username}</span>
                </span>
                <span className="rounded-full bg-pink-500/15 px-3 py-1 text-[11px] font-black text-pink-200 transition group-hover:bg-pink-500 group-hover:text-white">
                  Start
                </span>
              </button>
            ))
          ) : (
            <p className="p-3 text-sm font-medium text-zinc-500">No user found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default WhisperSearchBox;
