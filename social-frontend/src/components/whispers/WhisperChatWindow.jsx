import React from "react";
import WhisperChatHeader from "./WhisperChatHeader";
import WhisperComposer from "./WhisperComposer";
import WhisperMessageBubble from "./WhisperMessageBubble";
import WhisperTypingBubble from "./WhisperTypingBubble";

function MessageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 pt-2">
      {Array.from({ length: 7 }).map((_, index) => {
        const mine = index % 2;
        return (
          <div key={index} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`animate-pulse rounded-3xl border border-white/[0.05] bg-white/[0.06] shadow-lg shadow-black/10 ${
                mine ? "h-11 w-[48%] max-w-[280px]" : "h-12 w-[62%] max-w-[360px]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

function EmptyChatCard({ title, subtitle, compact = false }) {
  return (
    <div
      className={`mx-auto w-full max-w-sm rounded-3xl border border-white/[0.08] bg-white/[0.055] text-center shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl ${
        compact ? "p-5" : "p-7 sm:p-8"
      }`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-cyan-400/15 via-fuchsia-400/15 to-purple-500/15 text-2xl text-white shadow-lg shadow-purple-950/20">
        ✦
      </div>
      <h3 className={`${compact ? "text-lg" : "text-xl sm:text-2xl"} font-semibold tracking-tight text-white`}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subtitle}</p>
    </div>
  );
}

function WhisperChatWindow({
  activeConversation,
  activePerson,
  messages,
  allMessages = [],
  messageSearch = "",
  messageSearchCount = 0,
  setMessageSearch,
  messagesLoading,
  mobileChatOpen,
  typingUser,
  onlineUserIds = [],
  currentUserId,
  bottomRef,
  text,
  sending,
  mediaPreview,
  mediaUploading,
  deletingConversation,
  deletingMessageId,
  replyTo,
  lastMineMessage,
  onBack,
  onChangeText,
  onSendMessage,
  onReplyToMessage,
  onCancelReply,
  onSelectMedia,
  onClearMedia,
  onDeleteMessage,
  onRetryMessage,
  onReactToMessage,
  onDeleteConversation,
  onJumpToMessage,
}) {
  const baseClass = "min-h-0 h-full flex-col overflow-hidden bg-[#050711] md:relative md:flex md:border-l md:border-white/[0.07]";
  const mobileClass = mobileChatOpen ? "flex" : "hidden md:flex";

  return (
    <section className={`${baseClass} ${mobileClass}`}>
      {activeConversation ? (
        <>
          <WhisperChatHeader
            activePerson={activePerson}
            typingUser={typingUser}
            onlineUserIds={onlineUserIds}
            deletingConversation={deletingConversation}
            messageSearch={messageSearch}
            messageSearchCount={messageSearchCount}
            setMessageSearch={setMessageSearch}
            onBack={onBack}
            onDeleteConversation={() => onDeleteConversation?.(activeConversation._id)}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[#050711]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.13),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.085),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#050711] via-[#050711]/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050711] via-[#050711]/70 to-transparent" />

            <div
              className="relative h-full overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-color:transparent_transparent] [scrollbar-width:none] sm:px-4 md:px-7 md:py-5 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {messagesLoading ? (
                <MessageSkeleton />
              ) : messages.length ? (
                <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-start pb-4 pt-1 md:pb-5">
                  {messages.map((message, index) => {
                    const getSenderId = (item) => String(item?.sender?._id || item?.sender || "");
                    const mine = getSenderId(message) === String(currentUserId);
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    const senderId = getSenderId(message);
                    const samePrevSender = prevMessage && getSenderId(prevMessage) === senderId;
                    const sameNextSender = nextMessage && getSenderId(nextMessage) === senderId;
                    const time = new Date(message.createdAt || 0).getTime();
                    const prevTime = new Date(prevMessage?.createdAt || 0).getTime();
                    const nextTime = new Date(nextMessage?.createdAt || 0).getTime();
                    const closeToPrev = samePrevSender && Math.abs(time - prevTime) < 1000 * 60 * 3;
                    const closeToNext = sameNextSender && Math.abs(nextTime - time) < 1000 * 60 * 3;

                    return (
                      <WhisperMessageBubble
                        key={message._id}
                        message={message}
                        mine={mine}
                        activePerson={activePerson}
                        currentUserId={currentUserId}
                        isLastMine={lastMineMessage?._id === message._id}
                        isFirstInGroup={!closeToPrev}
                        isLastInGroup={!closeToNext}
                        deleting={deletingMessageId === message._id}
                        onReplyToMessage={onReplyToMessage}
                        onDeleteMessage={onDeleteMessage}
                        onRetryMessage={onRetryMessage}
                        onReactToMessage={onReactToMessage}
                        onJumpToMessage={onJumpToMessage}
                      />
                    );
                  })}
                  {typingUser && <WhisperTypingBubble />}
                  <div ref={bottomRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] items-start justify-center px-2 pt-8 text-center sm:items-center sm:pt-0">
                  <EmptyChatCard
                    title={messageSearch && allMessages.length ? "No matching whispers" : "Start a private chat"}
                    subtitle={messageSearch && allMessages.length ? "Try another word or clear search to see the full conversation." : "Send your first message and keep the conversation clean, private, and focused."}
                    compact
                  />
                </div>
              )}
            </div>
          </div>

          <WhisperComposer
            text={text}
            sending={sending}
            mediaPreview={mediaPreview}
            mediaUploading={mediaUploading}
            replyTo={replyTo}
            onChangeText={onChangeText}
            onSendMessage={onSendMessage}
            onCancelReply={onCancelReply}
            onSelectMedia={onSelectMedia}
            onClearMedia={onClearMedia}
          />
        </>
      ) : (
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden p-8 text-center md:flex">
          <div className="pointer-events-none absolute inset-0 bg-[#050711]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.13),transparent_34%),radial-gradient(circle_at_50%_86%,rgba(236,72,153,0.085),transparent_40%)]" />
          <div className="relative">
            <EmptyChatCard title="Select a conversation" subtitle="Open a chat or search for someone to start a new private whisper." />
          </div>
        </div>
      )}
    </section>
  );
}

export default WhisperChatWindow;
