import React from "react";
import WhisperChatHeader from "./WhisperChatHeader";
import WhisperComposer from "./WhisperComposer";
import WhisperMessageBubble from "./WhisperMessageBubble";
import WhisperTypingBubble from "./WhisperTypingBubble";

function WhisperChatWindow({
  activeConversation,
  activePerson,
  messages,
  messagesLoading,
  mobileChatOpen,
  typingUser,
  currentUserId,
  bottomRef,
  text,
  sending,
  onBack,
  onChangeText,
  onSendMessage,
}) {
  const baseClass =
    "min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.11),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.11),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent)] md:relative md:flex md:border-l md:border-white/10";

  const mobileClass = mobileChatOpen
    ? "fixed inset-x-0 bottom-0 top-[112px] z-[80] flex bg-[#050508] md:static md:z-auto"
    : "hidden md:flex";

  return (
    <section className={`${baseClass} ${mobileClass}`}>
      {activeConversation ? (
        <>
          <WhisperChatHeader activePerson={activePerson} typingUser={typingUser} onBack={onBack} />

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-5">
            {messagesLoading ? (
              <div className="space-y-4">
                <div className="h-14 w-2/3 animate-pulse rounded-[28px] bg-white/[0.05]" />
                <div className="ml-auto h-14 w-1/2 animate-pulse rounded-[28px] bg-white/[0.08]" />
                <div className="h-14 w-3/5 animate-pulse rounded-[28px] bg-white/[0.05]" />
                <div className="ml-auto h-14 w-2/5 animate-pulse rounded-[28px] bg-white/[0.08]" />
              </div>
            ) : messages.length ? (
              <div className="space-y-4 pb-1">
                <div className="mx-auto mb-4 w-fit rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 backdrop-blur-xl">
                  Private chat started
                </div>
                {messages.map((message) => {
                  const mine = message.sender?._id === currentUserId || message.sender === currentUserId;
                  return <WhisperMessageBubble key={message._id} message={message} mine={mine} activePerson={activePerson} />;
                })}
                {typingUser && <WhisperTypingBubble />}
                <div ref={bottomRef} />
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                <div className="mx-auto max-w-sm rounded-[34px] border border-white/10 bg-black/24 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[26px] bg-gradient-to-br from-pink-500/22 via-purple-500/20 to-cyan-500/18 text-3xl shadow-lg shadow-purple-500/10">
                    ✨
                  </div>
                  <h3 className="text-xl font-black text-white">No whispers yet</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">Start a private vibe with this person. Keep it real, respectful and clean.</p>
                </div>
              </div>
            )}
          </div>

          <WhisperComposer text={text} sending={sending} onChangeText={onChangeText} onSendMessage={onSendMessage} />
        </>
      ) : (
        <div className="hidden flex-1 items-center justify-center p-8 text-center md:flex">
          <div className="max-w-sm rounded-[34px] border border-white/10 bg-black/25 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.045] text-4xl">🌙</div>
            <h2 className="text-2xl font-black text-white">Select a whisper</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">Open a conversation or search someone to start a private vibe.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default WhisperChatWindow;
