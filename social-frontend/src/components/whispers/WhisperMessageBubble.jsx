import React, { useState } from "react";
import { formatWhisperTime, getInitials } from "../../utils/whisperHelpers";

function ReplySnippet({ replyTo, mine, onJumpToMessage }) {
  if (!replyTo) return null;
  return (
    <button
      type="button"
      onClick={() => onJumpToMessage?.(replyTo._id)}
      className={`mb-2 block w-full rounded-2xl border px-3 py-2 text-left transition ${
        mine ? "border-white/12 bg-black/14 hover:bg-black/20" : "border-white/[0.065] bg-white/[0.04] hover:bg-white/[0.06]"
      }`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${mine ? "text-white/62" : "text-zinc-500"}`}>Reply</p>
      <p className={`mt-0.5 truncate text-xs font-medium ${mine ? "text-white/82" : "text-zinc-300"}`}>{replyTo.text}</p>
    </button>
  );
}

function DesktopMenu({ mine, message, deleting, onClose, onReplyToMessage, onDeleteMessage }) {
  const copyAvailable = typeof navigator !== "undefined" && navigator.clipboard;

  const handleDelete = () => {
    onClose();
    if (mine && window.confirm("Delete this message?")) onDeleteMessage?.(message._id);
  };

  return (
    <div className={`absolute bottom-9 z-40 hidden w-44 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0b10]/98 p-1.5 shadow-2xl shadow-black/65 backdrop-blur-2xl sm:block ${mine ? "right-0" : "left-0"}`}>
      <button
        type="button"
        onClick={() => {
          onClose();
          onReplyToMessage?.(message);
        }}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.07]"
      >
        <span>Reply</span>
        <span className="text-zinc-600">↩</span>
      </button>
      {copyAvailable && (
        <button
          type="button"
          onClick={() => {
            onClose();
            navigator.clipboard.writeText(message.text || "");
          }}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.07]"
        >
          <span>Copy</span>
          <span className="text-zinc-600">⧉</span>
        </button>
      )}
      {mine && (
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/12 disabled:opacity-50"
        >
          <span>{deleting ? "Deleting..." : "Delete"}</span>
          <span className="text-red-300/50">✕</span>
        </button>
      )}
    </div>
  );
}

function MobileSheet({ mine, message, deleting, onClose, onReplyToMessage, onDeleteMessage }) {
  const copyAvailable = typeof navigator !== "undefined" && navigator.clipboard;

  const handleDelete = () => {
    onClose();
    if (mine && window.confirm("Delete this message?")) onDeleteMessage?.(message._id);
  };

  return (
    <div className="fixed inset-0 z-[140] sm:hidden">
      <button type="button" aria-label="Close message options" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] overflow-hidden rounded-3xl border border-white/[0.09] bg-[#090a0f]/98 p-2 shadow-2xl shadow-black/75 backdrop-blur-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/15" />
        <button
          type="button"
          onClick={() => {
            onClose();
            onReplyToMessage?.(message);
          }}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-white transition active:bg-white/[0.07]"
        >
          <span>Reply</span>
          <span className="text-zinc-500">↩</span>
        </button>
        {copyAvailable && (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigator.clipboard.writeText(message.text || "");
            }}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-white transition active:bg-white/[0.07]"
          >
            <span>Copy</span>
            <span className="text-zinc-500">⧉</span>
          </button>
        )}
        {mine && (
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-red-200 transition active:bg-red-500/12 disabled:opacity-50"
          >
            <span>{deleting ? "Deleting..." : "Delete"}</span>
            <span className="text-red-300/55">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}

function WhisperMessageBubble({
  message,
  mine,
  activePerson,
  currentUserId,
  isLastMine,
  isFirstInGroup = true,
  isLastInGroup = true,
  deleting,
  onReplyToMessage,
  onDeleteMessage,
  onJumpToMessage,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const senderLabel = activePerson?.name || activePerson?.username;
  const readBy = Array.isArray(message.readBy) ? message.readBy.map(String) : [];
  const seen = mine && isLastMine && readBy.some((id) => String(id) !== String(currentUserId));

  const openActions = () => setMenuOpen(true);
  const closeActions = () => setMenuOpen(false);

  const bubbleRadius = mine
    ? isLastInGroup
      ? "rounded-[22px] rounded-br-[8px]"
      : "rounded-[22px] rounded-br-[18px]"
    : isLastInGroup
      ? "rounded-[22px] rounded-bl-[8px]"
      : "rounded-[22px] rounded-bl-[18px]";

  return (
    <div
      id={`whisper-message-${message._id}`}
      className={`group flex scroll-mt-24 transition ${mine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-2.5" : "mt-0.5"}`}
    >
      <div className={`flex max-w-[82%] gap-2 sm:max-w-[76%] md:max-w-[66%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {!mine && (
          <div
            className={`mt-auto hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-[10px] font-semibold text-zinc-500 sm:flex ${
              isLastInGroup ? "opacity-100" : "opacity-0"
            }`}
          >
            {getInitials(senderLabel)}
          </div>
        )}

        <div className={`relative flex flex-col ${mine ? "items-end" : "items-start"}`}>
          <button
            type="button"
            onClick={openActions}
            onDoubleClick={() => onReplyToMessage?.(message)}
            onContextMenu={(event) => {
              event.preventDefault();
              openActions();
            }}
            className={`relative ${bubbleRadius} text-left shadow-md transition active:scale-[0.995] ${
              mine
                ? "bg-gradient-to-br from-[#c84ec0] via-[#7d5cf0] to-[#19a8c7] text-white shadow-violet-950/18"
                : "border border-white/[0.07] bg-white/[0.055] text-zinc-100 shadow-black/20 backdrop-blur-xl"
            }`}
          >
            <div className="px-3.5 py-2.5 md:max-w-[620px] md:px-4 md:py-2.5">
              <ReplySnippet replyTo={message.replyTo} mine={mine} onJumpToMessage={onJumpToMessage} />
              <p className="whitespace-pre-wrap break-words text-[14.5px] font-normal leading-relaxed text-white/95 md:text-[15px]">{message.text}</p>
              {isLastInGroup && (
                <div className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] font-medium ${mine ? "text-white/58" : "text-zinc-500"}`}>
                  <span>{formatWhisperTime(message.createdAt)}</span>
                </div>
              )}
            </div>
          </button>

          <div className={`relative mt-1 h-0 ${mine ? "self-end" : "self-start"}`}>
            <button
              type="button"
              onClick={openActions}
              className={`hidden h-7 w-7 -translate-y-7 items-center justify-center rounded-full border border-white/[0.075] bg-[#090a0f]/85 text-sm text-zinc-500 opacity-0 shadow-lg shadow-black/25 transition hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 sm:flex ${mine ? "-mr-9" : "-ml-9"}`}
              aria-label="Message options"
            >
              ⋯
            </button>

            {menuOpen && (
              <>
                <button type="button" aria-label="Close message options" className="fixed inset-0 z-30 hidden cursor-default bg-transparent sm:block" onClick={closeActions} />
                <DesktopMenu
                  mine={mine}
                  message={message}
                  deleting={deleting}
                  onClose={closeActions}
                  onReplyToMessage={onReplyToMessage}
                  onDeleteMessage={onDeleteMessage}
                />
                <MobileSheet
                  mine={mine}
                  message={message}
                  deleting={deleting}
                  onClose={closeActions}
                  onReplyToMessage={onReplyToMessage}
                  onDeleteMessage={onDeleteMessage}
                />
              </>
            )}
          </div>
          {seen && <p className="mt-1 pr-1 text-right text-[10px] font-medium text-zinc-500">Seen</p>}
        </div>
      </div>
    </div>
  );
}

export default WhisperMessageBubble;
