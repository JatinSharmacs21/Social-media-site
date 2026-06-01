import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { SOCKET_URL } from "../config/env";
import { getMessageSenderId, sortConversations } from "../utils/whisperHelpers";

function notifyWhisperCountChange(count) {
  window.dispatchEvent(new CustomEvent("vybeo:whispers-count", { detail: { count } }));
}

const updateParticipantPresence = (conversation, userId, lastSeen) => {
  if (!conversation?.participants?.length || !userId) return conversation;

  return {
    ...conversation,
    participants: conversation.participants.map((participant) => {
      const participantId = participant?._id || participant;
      if (String(participantId) !== String(userId) || !participant?._id) return participant;
      return { ...participant, lastSeen };
    }),
  };
};

function useWhisperSocket({
  token,
  activeId,
  currentUserId,
  setActiveConversation,
  setMessages,
  setConversations,
  setTypingUser,
  setOnlineUserIds,
  updateConversation,
  scrollToBottom,
}) {
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register-user");
      if (activeIdRef.current) socket.emit("join-whisper", { conversationId: activeIdRef.current });
    });

    socket.on("whisper-message-created", ({ conversation, message }) => {
      const activeConversationId = activeIdRef.current;
      const senderId = getMessageSenderId(message);
      const isActive = conversation?._id === activeConversationId;
      const isMine = String(senderId) === String(currentUserIdRef.current);

      updateConversation(conversation, { keepUnread: isActive || isMine });

      if (isActive && message?._id) {
        setMessages((prev) => (prev.some((item) => item._id === message._id) ? prev : [...prev, message]));
        setTypingUser(false);
        API.put(`/api/whispers/conversations/${conversation._id}/read`).catch(() => {});
        scrollToBottom();
      }

      notifyWhisperCountChange();
    });

    socket.on("whisper-inbox-updated", ({ conversation, message }) => {
      if (!conversation?._id) return;

      const activeConversationId = activeIdRef.current;
      const senderId = getMessageSenderId(message);
      const isMine = String(senderId) === String(currentUserIdRef.current);
      const isActive = conversation._id === activeConversationId;

      setConversations((prev) => {
        const exists = prev.some((item) => item._id === conversation._id);
        const next = exists
          ? prev.map((item) =>
              item._id === conversation._id
                ? { ...item, ...conversation, unreadCount: isActive || isMine ? 0 : Number(item.unreadCount || 0) + 1 }
                : item
            )
          : [{ ...conversation, unreadCount: isActive || isMine ? 0 : 1 }, ...prev];

        const sorted = sortConversations(next);
        notifyWhisperCountChange(sorted.reduce((total, item) => total + Number(item.unreadCount || 0), 0));
        return sorted;
      });
    });

    socket.on("whisper-message-deleted", ({ conversationId, messageId, conversation }) => {
      if (String(conversationId) === String(activeIdRef.current)) {
        setMessages((prev) => prev.filter((message) => String(message._id) !== String(messageId)));
      }

      setConversations((prev) => {
        const next = prev.map((item) => (String(item._id) === String(conversationId) && conversation ? { ...item, ...conversation } : item));
        return sortConversations(next);
      });

      notifyWhisperCountChange();
    });

    socket.on("whisper-conversation-deleted", ({ conversationId }) => {
      setConversations((prev) => prev.filter((item) => String(item._id) !== String(conversationId)));
      setMessages((prev) => (String(conversationId) === String(activeIdRef.current) ? [] : prev));
      if (String(conversationId) === String(activeIdRef.current)) setActiveConversation(null);
      notifyWhisperCountChange();
    });

    socket.on("whisper-online-users", ({ userIds = [] } = {}) => {
      setOnlineUserIds(Array.isArray(userIds) ? userIds.map(String) : []);
    });

    socket.on("whisper-user-presence", ({ userId, lastSeen }) => {
      if (!userId || !lastSeen) return;

      setConversations((prev) => prev.map((conversation) => updateParticipantPresence(conversation, userId, lastSeen)));
      setActiveConversation((current) => updateParticipantPresence(current, userId, lastSeen));
      setMessages((prev) =>
        prev.map((message) => {
          const senderId = message?.sender?._id || message?.sender;
          if (String(senderId) !== String(userId) || !message?.sender?._id) return message;
          return { ...message, sender: { ...message.sender, lastSeen } };
        })
      );
    });

    socket.on("whisper-user-typing", ({ conversationId, userId, typing }) => {
      if (String(conversationId) === String(activeIdRef.current) && String(userId) !== String(currentUserIdRef.current)) {
        setTypingUser(Boolean(typing));
      }
    });

    socket.on("whisper-seen", ({ conversationId, seenBy }) => {
      if (String(conversationId) === String(activeIdRef.current)) {
        setMessages((prev) =>
          prev.map((message) => {
            const isMine = String(getMessageSenderId(message)) === String(currentUserIdRef.current);
            if (!isMine || !seenBy) return message;
            const readBy = Array.isArray(message.readBy) ? message.readBy.map(String) : [];
            return readBy.includes(String(seenBy)) ? message : { ...message, readBy: [...readBy, seenBy] };
          })
        );
      }
    });

    return () => {
      socket.off("connect");
      socket.off("whisper-message-created");
      socket.off("whisper-inbox-updated");
      socket.off("whisper-message-deleted");
      socket.off("whisper-conversation-deleted");
      socket.off("whisper-online-users");
      socket.off("whisper-user-presence");
      socket.off("whisper-user-typing");
      socket.off("whisper-seen");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, setActiveConversation, setMessages, setConversations, setTypingUser, setOnlineUserIds, updateConversation, scrollToBottom]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return undefined;

    socket.emit("join-whisper", { conversationId: activeId });
    return () => socket.emit("leave-whisper", { conversationId: activeId });
  }, [activeId]);

  return socketRef;
}

export default useWhisperSocket;
