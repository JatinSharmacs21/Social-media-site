import React from "react";

function WhispersShell({ totalUnread, error, onClearError, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020204] text-white md:px-4 md:py-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[-150px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-170px] h-[560px] w-[560px] rounded-full bg-cyan-400/11 blur-3xl" />
        <div className="absolute left-[42%] top-[42%] h-[420px] w-[420px] rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_34%),linear-gradient(135deg,rgba(236,72,153,0.045),transparent_30%,rgba(34,211,238,0.035))]" />
      </div>

      <div className="relative mx-auto flex h-[calc(100svh-76px)] max-w-7xl flex-col overflow-hidden bg-[#050508]/72 md:h-[calc(100vh-32px)] md:rounded-[28px] md:border md:border-white/10 md:bg-[#050508]/84 md:shadow-2xl md:shadow-black/70">
        <header className="hidden shrink-0 border-b border-white/10 bg-black/30 px-5 py-3 backdrop-blur-2xl md:block">
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
              <span className="text-xs font-black text-zinc-300">Live</span>
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
