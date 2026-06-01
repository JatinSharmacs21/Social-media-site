import React from "react";

function ReplyPreview({ replyTo, onCancelReply }) {
  if (!replyTo) return null;
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.04] px-3 py-2 backdrop-blur-xl">
      <div className="min-w-0 border-l-2 border-pink-300/60 pl-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Replying to</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-zinc-200">{replyTo.text}</p>
      </div>
      <button
        type="button"
        onClick={onCancelReply}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-zinc-500 transition hover:bg-white/10 hover:text-white"
        aria-label="Cancel reply"
      >
        ✕
      </button>
    </div>
  );
}

function WhisperComposer({ text, sending, replyTo, onChangeText, onSendMessage, onCancelReply }) {
  const showCounter = text.length > 950;

  return (
    <form
      onSubmit={onSendMessage}
      className="shrink-0 border-t border-white/[0.06] bg-[#06070b]/94 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 shadow-2xl shadow-black/55 backdrop-blur-2xl md:px-5 md:pb-3 md:pt-3"
    >
      <div className="mx-auto max-w-4xl">
        <ReplyPreview replyTo={replyTo} onCancelReply={onCancelReply} />

        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.045] p-1.5 shadow-lg shadow-black/20 transition focus-within:border-pink-300/20 focus-within:bg-white/[0.06]">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) onSendMessage(e);
              }}
              placeholder="Write a message..."
              rows={1}
              maxLength={1200}
              className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] font-medium leading-relaxed text-white placeholder:text-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-base font-black text-white ring-1 ring-white/[0.08] transition hover:bg-white/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:ring-white/[0.04]"
              aria-label="Send message"
            >
              {sending ? "…" : "↑"}
            </button>
          </div>
        </div>
        {showCounter && (
          <div className="mt-2 flex justify-end px-2 text-[11px] font-semibold text-zinc-600">
            <span>{text.length}/1200</span>
          </div>
        )}
      </div>
    </form>
  );
}

export default WhisperComposer;
