import React, { useMemo, useState } from "react";
import { formatWhisperTime, getInitials } from "../../utils/whisperHelpers";

const REACTION_OPTIONS = ["❤️", "😂", "🔥", "👀", "😮"];

function ReplySnippet({ replyTo, mine, onJumpToMessage }) {
  if (!replyTo) return null;

  const handleJump = () => onJumpToMessage?.(replyTo._id);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleJump();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleJump}
      onKeyDown={handleKeyDown}
      className={`mb-2 block w-full cursor-pointer rounded-2xl border px-3 py-2 text-left transition ${
        mine ? "border-white/12 bg-black/14 hover:bg-black/20" : "border-white/[0.065] bg-white/[0.04] hover:bg-white/[0.06]"
      }`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${mine ? "text-white/62" : "text-zinc-500"}`}>Reply</p>
      <p className={`mt-0.5 truncate text-xs font-medium ${mine ? "text-white/82" : "text-zinc-300"}`}>{replyTo.text}</p>
    </div>
  );
}

function ReactionBar({ mine, selectedEmoji, onReactToMessage }) {
  return (
    <div
      className={`mb-1.5 flex w-max items-center gap-1 rounded-full border border-white/[0.09] bg-[#090a0f]/95 p-1 shadow-xl shadow-black/35 backdrop-blur-2xl ${
        mine ? "self-end" : "self-start"
      }`}
    >
      {REACTION_OPTIONS.map((emoji) => {
        const selected = selectedEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReactToMessage?.(emoji)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] transition active:scale-95 ${
              selected ? "bg-white text-base shadow-lg shadow-purple-950/20" : "hover:bg-white/[0.08]"
            }`}
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

function ReactionSummary({ reactions = [], currentUserId, mine }) {
  const groups = useMemo(() => {
    const map = new Map();
    reactions.forEach((reaction) => {
      if (!reaction?.emoji) return;
      const current = map.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, mine: false };
      current.count += 1;
      const userId = reaction.user?._id || reaction.user;
      if (String(userId) === String(currentUserId)) current.mine = true;
      map.set(reaction.emoji, current);
    });
    return Array.from(map.values());
  }, [reactions, currentUserId]);

  if (!groups.length) return null;

  return (
    <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
      {groups.map((group) => (
        <span
          key={group.emoji}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-lg shadow-black/20 backdrop-blur-xl ${
            group.mine
              ? "border-fuchsia-300/25 bg-fuchsia-400/18 text-fuchsia-50"
              : "border-white/[0.075] bg-[#090a0f]/82 text-zinc-200"
          }`}
        >
          <span>{group.emoji}</span>
          {group.count > 1 && <span className="text-[10px] opacity-75">{group.count}</span>}
        </span>
      ))}
    </div>
  );
}

function ReactionPicker({ selectedEmoji, onPick, mobile = false }) {
  return (
    <div
      className={`flex items-center justify-between rounded-[1.35rem] border border-white/[0.08] bg-white/[0.055] shadow-inner shadow-white/[0.025] ${
        mobile ? "mb-2 px-2 py-2" : "mb-1.5 px-1.5 py-1.5"
      }`}
    >
      {REACTION_OPTIONS.map((emoji) => {
        const selected = selectedEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick?.(emoji)}
            className={`flex items-center justify-center rounded-full transition active:scale-90 ${
              mobile ? "h-11 w-11 text-[21px]" : "h-9 w-9 text-[16px]"
            } ${
              selected
                ? "bg-white text-base shadow-lg shadow-fuchsia-950/25"
                : "hover:bg-white/[0.09] active:bg-white/[0.1]"
            }`}
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

function MenuAction({ label, icon, danger = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "text-red-200 hover:bg-red-500/12 active:bg-red-500/15"
          : "text-zinc-100 hover:bg-white/[0.075] active:bg-white/[0.09]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
          danger
            ? "border-red-300/10 bg-red-500/10 text-red-200/75 group-hover:bg-red-500/15"
            : "border-white/[0.07] bg-white/[0.045] text-zinc-400 group-hover:text-white"
        }`}
      >
        {icon}
      </span>
    </button>
  );
}

function DeleteConfirmDialog({ open, deleting, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center bg-black/55 px-3 pb-[calc(0.9rem+env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center sm:pb-0">
      <div className="w-full max-w-sm overflow-hidden rounded-[1.7rem] border border-white/[0.1] bg-[#090a0f]/98 p-3 shadow-2xl shadow-black/80 backdrop-blur-2xl">
        <div className="rounded-[1.35rem] border border-red-300/10 bg-red-500/[0.055] px-4 py-4">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/15 bg-red-500/12 text-lg text-red-100">
            ✕
          </div>
          <h3 className="text-[16px] font-semibold text-white">Delete message?</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            This message will be removed from the conversation. This action cannot be undone.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-2xl border border-red-300/15 bg-red-500/18 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/24 active:scale-[0.99] disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopMenu({ mine, message, deleting, selectedEmoji, onClose, onReplyToMessage, onRequestDelete, onReactToMessage }) {
  const copyAvailable = typeof navigator !== "undefined" && navigator.clipboard;

  const handleReaction = (emoji) => {
    onClose();
    onReactToMessage?.(message._id, emoji);
  };

  return (
    <div
      className={`absolute bottom-9 z-40 hidden w-60 overflow-hidden rounded-[1.35rem] border border-white/[0.1] bg-[#090a0f]/98 p-2 shadow-2xl shadow-black/70 backdrop-blur-2xl sm:block ${
        mine ? "right-0" : "left-0"
      }`}
    >
      <ReactionPicker selectedEmoji={selectedEmoji} onPick={handleReaction} />
      <div className="space-y-1">
        <MenuAction
          label="Reply"
          icon="↩"
          onClick={() => {
            onClose();
            onReplyToMessage?.(message);
          }}
        />
        {copyAvailable && (
          <MenuAction
            label="Copy"
            icon="⧉"
            onClick={() => {
              onClose();
              navigator.clipboard.writeText(message.text || "");
            }}
          />
        )}
        {mine && (
          <MenuAction
            label={deleting ? "Deleting..." : "Delete"}
            icon="✕"
            danger
            disabled={deleting}
            onClick={() => {
              onClose();
              onRequestDelete?.();
            }}
          />
        )}
      </div>
    </div>
  );
}

function MobileSheet({ mine, message, deleting, selectedEmoji, onClose, onReplyToMessage, onRequestDelete, onReactToMessage }) {
  const copyAvailable = typeof navigator !== "undefined" && navigator.clipboard;

  const handleReaction = (emoji) => {
    onClose();
    onReactToMessage?.(message._id, emoji);
  };

  return (
    <div className="fixed inset-0 z-[140] sm:hidden">
      <button
        type="button"
        aria-label="Close message options"
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-[#090a0f]/98 p-2.5 shadow-2xl shadow-black/80 backdrop-blur-2xl">
        <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-white/15" />
        <ReactionPicker selectedEmoji={selectedEmoji} onPick={handleReaction} mobile />

        <div className="space-y-1">
          <MenuAction
            label="Reply"
            icon="↩"
            onClick={() => {
              onClose();
              onReplyToMessage?.(message);
            }}
          />
          {copyAvailable && (
            <MenuAction
              label="Copy"
              icon="⧉"
              onClick={() => {
                onClose();
                navigator.clipboard.writeText(message.text || "");
              }}
            />
          )}
          {mine && (
            <MenuAction
              label={deleting ? "Deleting..." : "Delete"}
              icon="✕"
              danger
              disabled={deleting}
              onClick={() => {
                onClose();
                onRequestDelete?.();
              }}
            />
          )}
        </div>
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
  onReactToMessage,
  onJumpToMessage,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionBarOpen, setReactionBarOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const senderLabel = activePerson?.name || activePerson?.username;
  const readBy = Array.isArray(message.readBy) ? message.readBy.map(String) : [];
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const seen = mine && isLastMine && readBy.some((id) => String(id) !== String(currentUserId));
  const myReaction = reactions.find((reaction) => String(reaction.user?._id || reaction.user) === String(currentUserId));

  const openActions = () => setMenuOpen(true);
  const closeActions = () => setMenuOpen(false);

  const requestDelete = () => {
    if (!mine || deleting) return;
    setDeleteConfirmOpen(true);
  };

  const cancelDelete = () => setDeleteConfirmOpen(false);

  const confirmDelete = () => {
    if (!mine || deleting) return;
    onDeleteMessage?.(message._id);
    setDeleteConfirmOpen(false);
  };

  const handleBubbleDoubleClick = () => setReactionBarOpen((open) => !open);
  const handleReact = (emoji) => {
    setReactionBarOpen(false);
    onReactToMessage?.(message._id, emoji);
  };

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
          {reactionBarOpen && <ReactionBar mine={mine} selectedEmoji={myReaction?.emoji} onReactToMessage={handleReact} />}

          <button
            type="button"
            onClick={openActions}
            onDoubleClick={handleBubbleDoubleClick}
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

          <ReactionSummary reactions={reactions} currentUserId={currentUserId} mine={mine} />

          <div className={`relative mt-1 h-0 ${mine ? "self-end" : "self-start"}`}>
            <button
              type="button"
              onClick={openActions}
              className={`hidden h-7 w-7 -translate-y-7 items-center justify-center rounded-full border border-white/[0.075] bg-[#090a0f]/85 text-sm text-zinc-500 opacity-0 shadow-lg shadow-black/25 transition hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 sm:flex ${
                mine ? "-mr-9" : "-ml-9"
              }`}
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
                  selectedEmoji={myReaction?.emoji}
                  onClose={closeActions}
                  onReplyToMessage={onReplyToMessage}
                  onRequestDelete={requestDelete}
                  onReactToMessage={onReactToMessage}
                />
                <MobileSheet
                  mine={mine}
                  message={message}
                  deleting={deleting}
                  selectedEmoji={myReaction?.emoji}
                  onClose={closeActions}
                  onReplyToMessage={onReplyToMessage}
                  onRequestDelete={requestDelete}
                  onReactToMessage={onReactToMessage}
                />
              </>
            )}
          </div>
          {seen && <p className="mt-1 pr-1 text-right text-[10px] font-medium text-zinc-500">Seen</p>}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            deleting={deleting}
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
          />
        </div>
      </div>
    </div>
  );
}

export default WhisperMessageBubble;
