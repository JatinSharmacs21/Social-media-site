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
    filteredMessages,
    messageSearch,
    messageSearchCount,
    setMessageSearch,
    mediaPreview,
    mediaUploading,
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
    onlineUserIds,
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
    selectMedia,
    clearMedia,
    sendMessage,
    retryMessage,
    deleteMessage,
    reactToMessage,
    deleteConversation,
    togglePinConversation,
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
          onlineUserIds={onlineUserIds}
          onOpenConversation={openConversation}
          onStartConversation={startConversation}
          onDeleteConversation={deleteConversation}
          onTogglePinConversation={togglePinConversation}
        />

        <WhisperChatWindow
          activeConversation={activeConversation}
          activePerson={activePerson}
          messages={filteredMessages}
          allMessages={messages}
          messageSearch={messageSearch}
          messageSearchCount={messageSearchCount}
          setMessageSearch={setMessageSearch}
          messagesLoading={messagesLoading}
          mobileChatOpen={mobileChatOpen}
          typingUser={typingUser}
          onlineUserIds={onlineUserIds}
          currentUserId={currentUserId}
          bottomRef={bottomRef}
          text={text}
          sending={sending}
          mediaPreview={mediaPreview}
          mediaUploading={mediaUploading}
          deletingConversation={deletingConversation}
          deletingMessageId={deletingMessageId}
          replyTo={replyTo}
          lastMineMessage={lastMineMessage}
          onBack={closeMobileChat}
          onChangeText={handleTyping}
          onSendMessage={sendMessage}
          onReplyToMessage={setReplyTo}
          onCancelReply={cancelReply}
          onSelectMedia={selectMedia}
          onClearMedia={clearMedia}
          onDeleteMessage={deleteMessage}
          onRetryMessage={retryMessage}
          onReactToMessage={reactToMessage}
          onDeleteConversation={deleteConversation}
          onJumpToMessage={jumpToMessage}
        />
      </div>
    </WhispersShell>
  );
}

export default Whispers;
