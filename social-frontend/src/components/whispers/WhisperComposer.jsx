import React, { useEffect, useRef } from "react";

function ReplyPreview({ replyTo, onCancelReply }) {
  if (!replyTo) return null;

  const previewText = replyTo.text || "Message";

  return (
    <div className="mb-2 overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.055] shadow-lg shadow-black/15 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="min-w-0 border-l-2 border-cyan-300/60 pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Replying to</p>
          <p className="mt-0.5 truncate text-[13px] font-normal leading-snug text-zinc-200">{previewText}</p>
        </div>
        <button
          type="button"
          onClick={onCancelReply}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-xs font-medium text-zinc-500 transition hover:bg-white/10 hover:text-white active:scale-95"
          aria-label="Cancel reply"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function WhisperComposer({ text, sending, replyTo, onChangeText, onSendMessage, onCancelReply }) {
  const textareaRef = useRef(null);
  const hasText = Boolean(text.trim());
  const showCounter = text.length > 950;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [text]);

  return (
    <form
      onSubmit={onSendMessage}
      className="shrink-0 border-t border-white/[0.06] bg-[#06070b]/96 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/55 backdrop-blur-xl md:px-5 md:pb-3 md:pt-3"
    >
      <div className="mx-auto max-w-4xl">
        <ReplyPreview replyTo={replyTo} onCancelReply={onCancelReply} />

        <div className="rounded-[24px] border border-white/[0.085] bg-white/[0.045] p-1 shadow-lg shadow-black/20 transition duration-200 focus-within:border-cyan-300/25 focus-within:bg-white/[0.065] focus-within:shadow-cyan-950/20">
          <div className="flex items-end gap-2">
            <div className="flex min-h-[42px] flex-1 items-end rounded-[20px] bg-black/10 px-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => onChangeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) onSendMessage(e);
                }}
                placeholder={replyTo ? "Write your reply..." : "Message..."}
                rows={1}
                maxLength={1200}
                className="max-h-28 min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-[15px] font-normal leading-relaxed text-white placeholder:text-zinc-600 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />
            </div>

            <button
              type="submit"
              disabled={!hasText || sending}
              className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] text-base font-semibold shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:shadow-none ${
                hasText && !sending
                  ? "bg-gradient-to-br from-cyan-300 via-fuchsia-400 to-pink-400 text-white shadow-fuchsia-950/25 ring-1 ring-white/15 hover:brightness-110"
                  : "bg-white/[0.075] text-zinc-600 ring-1 ring-white/[0.055]"
              }`}
              aria-label="Send message"
            >
              {sending ? "…" : "↑"}
            </button>
          </div>
        </div>

        {showCounter && (
          <div className="mt-1.5 flex justify-end px-2 text-[10px] font-medium text-zinc-600">
            <span>{text.length}/1200</span>
          </div>
        )}
      </div>
    </form>
  );
}

export default WhisperComposer;
