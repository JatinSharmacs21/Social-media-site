import React from "react";

function WhispersShell({ totalUnread, error, onClearError, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020204] text-white md:px-4 md:py-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-120px] h-[460px] w-[460px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-150px] h-[460px] w-[460px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:42px_42px] opacity-60" />
      </div>

      <div className="relative mx-auto flex h-[calc(100svh-82px)] max-w-7xl flex-col overflow-hidden bg-[#050508]/75 md:h-[calc(100vh-32px)] md:rounded-[28px] md:border md:border-white/10 md:bg-[#050508]/85 md:shadow-2xl md:shadow-black/70">
        <header className="hidden shrink-0 border-b border-white/10 bg-black/35 px-5 py-3 backdrop-blur-2xl md:block">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white">Whispers</h1>
                {totalUnread > 0 && (
                  <span className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2.5 py-1 text-xs font-black text-white shadow-lg shadow-pink-500/25">
                    {totalUnread > 99 ? "99+" : totalUnread} new
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">Private chats, Vybeo style.</p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 shadow-xl shadow-black/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-black text-zinc-300">Live mode</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-3 mt-3 shrink-0 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-xl shadow-red-950/20 backdrop-blur-xl md:mx-5">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={onClearError}
                className="rounded-full px-2 py-1 text-red-100 transition hover:bg-white/10 hover:text-white"
                type="button"
              >
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
