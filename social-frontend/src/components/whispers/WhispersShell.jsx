import React from "react";

function WhispersShell({ totalUnread, error, onClearError, children }) {
  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#030306] pt-[76px] pb-[74px] text-white md:min-h-screen md:h-auto md:overflow-hidden md:px-4 md:py-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#030306]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_4%,rgba(236,72,153,0.075),transparent_34%),radial-gradient(circle_at_8%_92%,rgba(34,211,238,0.06),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_28%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl flex-col overflow-hidden bg-[#06070b]/94 shadow-2xl shadow-black/75 ring-1 ring-white/[0.065] backdrop-blur-2xl md:h-[calc(100vh-32px)] md:rounded-[28px]">
        <header className="hidden shrink-0 border-b border-white/[0.06] bg-[#07070c]/88 px-5 py-3 backdrop-blur-2xl md:block">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.045] text-base font-black text-pink-100 ring-1 ring-white/[0.075]">
                ✦
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-white">Whispers</h1>
                <p className="text-xs font-semibold text-zinc-500">Private conversations</p>
              </div>
              {totalUnread > 0 && (
                <span className="rounded-full border border-pink-300/15 bg-pink-500/8 px-2.5 py-1 text-xs font-black text-pink-100">
                  {totalUnread > 99 ? "99+" : totalUnread} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.065] bg-white/[0.035] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]" />
              <span className="text-xs font-bold text-zinc-500">Realtime</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-3 mt-3 shrink-0 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 shadow-xl shadow-red-950/20 backdrop-blur-xl md:mx-5">
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
