import React from "react";

function ActionNotice({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm">
      <div className="rounded-2xl border border-pink-400/25 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl shadow-pink-500/20 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 flex items-center justify-center shrink-0">
            ⚠️
          </div>

          <div className="flex-1">
            <p className="text-sm font-black text-white">Notice</p>
            <p className="text-sm text-gray-300 mt-1">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionNotice;