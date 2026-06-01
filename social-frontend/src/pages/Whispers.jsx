import React from "react";
import WhisperChatWindow from "../components/whispers/WhisperChatWindow";
import WhisperInbox from "../components/whispers/WhisperInbox";
import WhispersShell from "../components/whispers/WhispersShell";
import useWhispers from "../hooks/useWhispers";

function Whispers() {
  const {
    conversations,
    activeConversation,
    activePerson,
    messages,
    loading,
    messagesLoading,
    sending,
    deletingConversation,
    deletingMessageId,
    text,
    query,
    users,
    searching,
    typingUser,
    error,
    mobileChatOpen,
    bottomRef,
    activeId,
    currentUserId,
    totalUnread,
    emptyState,
    replyTo,
    lastMineMessage,
    setQuery,
    clearError,
    closeMobileChat,
    openConversation,
    startConversation,
    handleTyping,
    setReplyTo,
    cancelReply,
    sendMessage,
    deleteMessage,
    deleteConversation,
    jumpToMessage,
  } = useWhispers();

  return (
    <WhispersShell totalUnread={totalUnread} error={error} onClearError={clearError}>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[330px_1fr] lg:grid-cols-[350px_1fr]">
        <WhisperInbox
          conversations={conversations}
          loading={loading}
          emptyState={emptyState}
          mobileChatOpen={mobileChatOpen}
          query={query}
          setQuery={setQuery}
          users={users}
          searching={searching}
          activeId={activeId}
          currentUserId={currentUserId}
          deletingConversation={deletingConversation}
          onOpenConversation={openConversation}
          onStartConversation={startConversation}
          onDeleteConversation={deleteConversation}
        />

        <WhisperChatWindow
          activeConversation={activeConversation}
          activePerson={activePerson}
          messages={messages}
          messagesLoading={messagesLoading}
          mobileChatOpen={mobileChatOpen}
          typingUser={typingUser}
          currentUserId={currentUserId}
          bottomRef={bottomRef}
          text={text}
          sending={sending}
          deletingConversation={deletingConversation}
          deletingMessageId={deletingMessageId}
          replyTo={replyTo}
          lastMineMessage={lastMineMessage}
          onBack={closeMobileChat}
          onChangeText={handleTyping}
          onSendMessage={sendMessage}
          onReplyToMessage={setReplyTo}
          onCancelReply={cancelReply}
          onDeleteMessage={deleteMessage}
          onDeleteConversation={deleteConversation}
          onJumpToMessage={jumpToMessage}
        />
      </div>
    </WhispersShell>
  );
}

export default Whispers;
