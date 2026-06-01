import React from "react";
import Avatar from "../ui/Avatar";

function WhisperSearchBox({ query, setQuery, users, searching, onStartConversation }) {
  return (
    <div className="relative">
      <div className="flex h-10 items-center gap-2.5 rounded-[20px] border border-white/[0.075] bg-white/[0.032] px-3.5 shadow-lg shadow-black/10 transition focus-within:border-pink-300/24 focus-within:bg-white/[0.052] focus-within:shadow-pink-950/10">
        <span className="text-[15px] text-zinc-500">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-zinc-600 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-zinc-500 transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-[22px] border border-white/[0.075] bg-[#090a0f]/98 p-1.5 shadow-2xl shadow-black/45 backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {searching ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-13 animate-pulse rounded-2xl bg-white/[0.055]" />
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
                <span className="rounded-full bg-white/[0.075] p-[2px] group-hover:bg-gradient-to-br group-hover:from-pink-400/28 group-hover:via-violet-400/25 group-hover:to-cyan-300/25">
                  <Avatar src={user.profilePic} name={user.name || user.username} size="md" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{user.name || user.username}</span>
                  <span className="block truncate text-xs font-medium text-zinc-500">@{user.username}</span>
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.055] px-3 py-1 text-[11px] font-semibold text-zinc-200 transition group-hover:border-pink-200/15 group-hover:text-white">
                  Start
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm font-medium text-zinc-300">No user found</p>
              <p className="mt-1 text-xs text-zinc-600">Try a different name or username.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WhisperSearchBox;
