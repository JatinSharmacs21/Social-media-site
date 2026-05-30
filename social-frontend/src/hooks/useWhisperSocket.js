import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { SOCKET_URL } from "../config/env";
import { sortConversations } from "../utils/whisperHelpers";

function notifyWhisperCountChange() {
  window.dispatchEvent(new CustomEvent("vybeo:whispers-count"));
}

function useWhisperSocket({
  token,
  activeId,
  currentUserId,
  setMessages,
  setConversations,
  setTypingUser,
  updateConversation,
  scrollToBottom,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register-user");
      if (activeId) socket.emit("join-whisper", { conversationId: activeId });
    });

    socket.on("whisper-message-created", ({ conversation, message }) => {
      updateConversation(conversation);

      if (conversation?._id === activeId) {
        setMessages((prev) =>
          prev.some((item) => item._id === message._id) ? prev : [...prev, message]
        );
        API.put(`/api/whispers/conversations/${conversation._id}/read`).catch(() => {});
        scrollToBottom();
      }

      notifyWhisperCountChange();
    });

    socket.on("whisper-inbox-updated", ({ conversation, message }) => {
      if (!conversation?._id) return;

      const isActive = conversation._id === activeId;

      setConversations((prev) => {
        const exists = prev.some((item) => item._id === conversation._id);
        const next = exists
          ? prev.map((item) =>
              item._id === conversation._id
                ? {
                    ...item,
                    ...conversation,
                    unreadCount:
                      isActive || message?.sender?._id === currentUserId
                        ? 0
                        : Number(item.unreadCount || 0) + 1,
                  }
                : item
            )
          : [{ ...conversation, unreadCount: isActive ? 0 : 1 }, ...prev];

        return sortConversations(next);
      });

      if (!isActive) notifyWhisperCountChange();
    });

    socket.on("whisper-user-typing", ({ conversationId, userId, typing }) => {
      if (conversationId === activeId && userId !== currentUserId) {
        setTypingUser(Boolean(typing));
      }
    });

    socket.on("whisper-seen", ({ conversationId }) => {
      if (conversationId === activeId) {
        setMessages((prev) => [...prev]);
      }
    });

    return () => {
      socket.off("whisper-message-created");
      socket.off("whisper-inbox-updated");
      socket.off("whisper-user-typing");
      socket.off("whisper-seen");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    token,
    activeId,
    currentUserId,
    setMessages,
    setConversations,
    setTypingUser,
    updateConversation,
    scrollToBottom,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return undefined;

    socket.emit("join-whisper", { conversationId: activeId });
    return () => socket.emit("leave-whisper", { conversationId: activeId });
  }, [activeId]);

  return socketRef;
}

export default useWhisperSocket;
