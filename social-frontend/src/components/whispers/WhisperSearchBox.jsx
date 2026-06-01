import React from "react";
import Avatar from "../ui/Avatar";

function WhisperSearchBox({ query, setQuery, users, searching, onStartConversation }) {
  return (
    <div className="relative">
      <div className="flex h-12 items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.035] px-3.5 shadow-lg shadow-black/15 transition focus-within:border-pink-300/22 focus-within:bg-white/[0.055]">
        <span className="text-base text-zinc-500">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-zinc-600 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2.5 py-1 text-xs font-bold text-zinc-500 transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-[20px] border border-white/[0.075] bg-[#090a0f]/98 p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl">
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
                <span className="rounded-full bg-gradient-to-br from-pink-400/35 via-violet-400/30 to-cyan-300/30 p-[2px]">
                  <Avatar src={user.profilePic} name={user.name || user.username} size="md" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-white">{user.name || user.username}</span>
                  <span className="block truncate text-xs font-medium text-zinc-500">@{user.username}</span>
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-1 text-[11px] font-black text-zinc-100">
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
