import React from "react";

function WhispersShell({ totalUnread, error, onClearError, children }) {
  return (
    <main className="relative h-[calc(100dvh-76px-80px)] overflow-hidden bg-[#030306] text-white md:h-screen md:p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#030306]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(236,72,153,0.075),transparent_34%),radial-gradient(circle_at_8%_88%,rgba(34,211,238,0.055),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_30%)]" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl flex-col overflow-hidden bg-[#06070b]/96 shadow-2xl shadow-black/75 ring-1 ring-white/[0.065] backdrop-blur-2xl md:rounded-[28px]">
        <header className="hidden shrink-0 border-b border-white/[0.06] bg-[#07070c]/88 px-5 py-3 backdrop-blur-2xl md:block">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.045] text-base font-bold text-pink-100 ring-1 ring-white/[0.075]">
                ✦
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold tracking-tight text-white">Whispers</h1>
                <p className="text-xs font-medium text-zinc-500">Private conversations</p>
              </div>
              {totalUnread > 0 && (
                <span className="rounded-full border border-pink-300/15 bg-pink-500/10 px-2.5 py-1 text-xs font-bold text-pink-100">
                  {totalUnread > 99 ? "99+" : totalUnread} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.065] bg-white/[0.035] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]" />
              <span className="text-xs font-semibold text-zinc-500">Realtime</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-3 mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 shadow-xl shadow-red-950/20 backdrop-blur-xl md:mx-5">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={onClearError} className="rounded-full px-2 py-1 text-red-100 transition hover:bg-white/10 hover:text-white" type="button">
                ✕
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </main>
  );
}

export default WhispersShell;
