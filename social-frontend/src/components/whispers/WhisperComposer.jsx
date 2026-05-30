import React from "react";

function WhisperComposer({ text, sending, onChangeText, onSendMessage }) {
  const showCounter = text.length > 900;

  return (
    <form onSubmit={onSendMessage} className="shrink-0 border-t border-white/10 bg-[#030306]/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl md:p-4">
      <div className="flex items-end gap-2 rounded-[28px] border border-white/10 bg-white/[0.055] p-2 shadow-xl shadow-black/30 transition focus-within:border-pink-400/45 focus-within:bg-white/[0.08]">
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSendMessage(e);
          }}
          placeholder="Write a whisper..."
          rows={1}
          maxLength={1200}
          className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] font-medium text-white placeholder:text-zinc-600 outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 text-lg font-black text-white shadow-lg shadow-pink-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Send whisper"
        >
          {sending ? "…" : "➤"}
        </button>
      </div>
      {showCounter && (
        <div className="mt-2 flex justify-end px-2 text-[11px] font-medium text-zinc-600">
          <span>{text.length}/1200</span>
        </div>
      )}
    </form>
  );
}

export default WhisperComposer;
