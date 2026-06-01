import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { getMessageSenderId, getOtherParticipant, getUserId, sortConversations } from "../utils/whisperHelpers";
import logger from "../utils/logger";
import useWhisperSocket from "./useWhisperSocket";

function notifyWhisperCountChange(count) {
  window.dispatchEvent(new CustomEvent("vybeo:whispers-count", { detail: { count } }));
}

function useWhispers() {
  const token = localStorage.getItem("token");
  const currentUserId = getUserId();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [typingUser, setTypingUser] = useState(false);
  const [error, setError] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  const activeId = activeConversation?._id;

  const activePerson = useMemo(
    () => getOtherParticipant(activeConversation, currentUserId),
    [activeConversation, currentUserId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0),
    [conversations]
  );

  const emptyState = !loading && conversations.length === 0;

  const lastMineMessage = useMemo(
    () => [...messages].reverse().find((message) => String(getMessageSenderId(message)) === String(currentUserId)),
    [messages, currentUserId]
  );

  const clearError = useCallback(() => setError(""), []);
  const closeMobileChat = useCallback(() => setMobileChatOpen(false), []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const updateConversation = useCallback((conversation, options = {}) => {
    if (!conversation?._id) return;

    setConversations((prev) => {
      const exists = prev.some((item) => item._id === conversation._id);
      const next = exists
        ? prev.map((item) => {
            if (item._id !== conversation._id) return item;
            return {
              ...item,
              ...conversation,
              unreadCount: options.keepUnread ? item.unreadCount : conversation.unreadCount ?? item.unreadCount ?? 0,
            };
          })
        : [conversation, ...prev];

      return sortConversations(next);
    });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/whispers/conversations");
      setConversations(res.data || []);
      setActiveConversation((current) => current || res.data?.[0] || null);
    } catch (err) {
      logger.error(err.response?.data || err);
      setError("Whispers could not be loaded. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversation) => {
      if (!conversation?._id) return;

      try {
        setMessagesLoading(true);
        const res = await API.get(`/api/whispers/conversations/${conversation._id}/messages`);
        setMessages(res.data || []);
        setConversations((prev) =>
          prev.map((item) => (item._id === conversation._id ? { ...item, unreadCount: 0 } : item))
        );
        notifyWhisperCountChange();
        scrollToBottom();
      } catch (err) {
        logger.error(err.response?.data || err);
        setError("Messages could not be loaded.");
      } finally {
        setMessagesLoading(false);
      }
    },
    [scrollToBottom]
  );

  const socketRef = useWhisperSocket({
    token,
    activeId,
    currentUserId,
    setActiveConversation,
    setMessages,
    setConversations,
    setTypingUser,
    updateConversation,
    scrollToBottom,
  });

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversation) loadMessages(activeConversation);
    setReplyTo(null);
    setTypingUser(false);
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setSearching(false);
      return undefined;
    }

    const searchUsers = async () => {
      try {
        setSearching(true);
        const res = await API.get(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        setUsers((res.data || []).filter((user) => user._id !== currentUserId));
      } catch (err) {
        logger.error(err.response?.data || err);
      } finally {
        setSearching(false);
      }
    };

    const timeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  useEffect(() => {
    return () => clearTimeout(typingTimerRef.current);
  }, []);

  const openConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setTypingUser(false);
    setMobileChatOpen(true);
  }, []);

  const startConversation = useCallback(
    async (user) => {
      try {
        const res = await API.post("/api/whispers/conversations", { participantId: user._id });
        updateConversation(res.data);
        setActiveConversation(res.data);
        setMobileChatOpen(true);
        setQuery("");
        setUsers([]);
      } catch (err) {
        logger.error(err.response?.data || err);
        setError("Conversation could not be started.");
      }
    },
    [updateConversation]
  );

  const handleTyping = useCallback(
    (value) => {
      setText(value);
      if (!socketRef.current || !activeId) return;

      socketRef.current.emit("whisper-typing", { conversationId: activeId, typing: true });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit("whisper-typing", { conversationId: activeId, typing: false });
      }, 900);
    },
    [activeId, socketRef]
  );

  const cancelReply = useCallback(() => setReplyTo(null), []);

  const sendMessage = useCallback(
    async (event) => {
      event.preventDefault();
      const cleanText = text.trim();
      if (!cleanText || !activeId || sending) return;

      const payload = {
        text: cleanText,
        replyTo: replyTo?._id || null,
      };

      try {
        setSending(true);
        setText("");
        setReplyTo(null);
        socketRef.current?.emit("whisper-typing", { conversationId: activeId, typing: false });
        const res = await API.post(`/api/whispers/conversations/${activeId}/messages`, payload);
        updateConversation(res.data.conversation);
      } catch (err) {
        logger.error(err.response?.data || err);
        setText(cleanText);
        setReplyTo(replyTo);
        setError("Message could not be sent. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [activeId, replyTo, sending, socketRef, text, updateConversation]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      if (!messageId || deletingMessageId) return;

      try {
        setDeletingMessageId(messageId);

        const endpoint = activeId
          ? `/api/whispers/conversations/${activeId}/messages/${messageId}`
          : `/api/whispers/messages/${messageId}`;

        const res = await API.delete(endpoint);

        setMessages((prev) => prev.filter((message) => String(message._id) !== String(messageId)));
        if (res.data?.conversation) updateConversation(res.data.conversation);
        notifyWhisperCountChange();
      } catch (err) {
        logger.error(err.response?.data || err);
        setError(err.response?.data?.message || "Message could not be deleted.");
      } finally {
        setDeletingMessageId("");
      }
    },
    [activeId, deletingMessageId, updateConversation]
  );

  const deleteConversation = useCallback(async (conversationId = activeId) => {
    if (!conversationId || deletingConversation) return;
    try {
      setDeletingConversation(true);
      await API.delete(`/api/whispers/conversations/${conversationId}`);
      setConversations((prev) => prev.filter((item) => String(item._id) !== String(conversationId)));
      if (String(activeId) === String(conversationId)) {
        setActiveConversation(null);
        setMessages([]);
        setMobileChatOpen(false);
      }
      notifyWhisperCountChange();
    } catch (err) {
      logger.error(err.response?.data || err);
      setError("Conversation could not be deleted.");
    } finally {
      setDeletingConversation(false);
    }
  }, [activeId, deletingConversation]);

  const jumpToMessage = useCallback((messageId) => {
    const node = document.getElementById(`whisper-message-${messageId}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("ring-2", "ring-pink-400/60");
    window.setTimeout(() => node.classList.remove("ring-2", "ring-pink-400/60"), 1100);
  }, []);

  return {
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
  };
}

export default useWhispers;
