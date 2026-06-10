import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { getMessageSenderId, getOtherParticipant, getUserId, sortConversations } from "../utils/whisperHelpers";
import logger from "../utils/logger";
import useWhisperSocket from "./useWhisperSocket";

function notifyWhisperCountChange(count) {
  window.dispatchEvent(new CustomEvent("vybeo:whispers-count", { detail: { count } }));
}

const createPendingId = () => `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const buildPendingMessage = ({ conversationId, currentUserId, text, replyTo, mediaPreview, mediaFile }) => ({
  _id: createPendingId(),
  conversation: conversationId,
  sender: currentUserId,
  text,
  replyTo: replyTo || null,
  media: mediaPreview
    ? {
        url: mediaPreview.previewUrl,
        type: mediaPreview.type,
        name: mediaPreview.name || mediaFile?.name || "Media",
        size: mediaPreview.size || mediaFile?.size || 0,
        local: true,
      }
    : undefined,
  readBy: [currentUserId],
  createdAt: new Date().toISOString(),
  status: "sending",
  isPending: true,
  _retryPayload: {
    text,
    replyToId: replyTo?._id || null,
    replyTo: replyTo || null,
    mediaFile: mediaFile || null,
    mediaPreview: mediaPreview || null,
  },
});

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
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [error, setError] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [messageSearch, setMessageSearch] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const pendingRequestCountRef = useRef(0);

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

      return sortConversations(next, currentUserId);
    });
  }, [currentUserId]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/whispers/conversations");
      const sortedConversations = sortConversations(res.data || [], currentUserId);
      setConversations(sortedConversations);
      // Do not auto-open the first conversation.
      // Auto-opening was marking messages as seen when the user only visited Whispers.
      setActiveConversation((current) => current);
    } catch (err) {
      logger.error(err.response?.data || err);
      setError("Whispers could not be loaded. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const loadMessages = useCallback(
    async (conversation) => {
      if (!conversation?._id) return;

      try {
        setMessagesLoading(true);
        const res = await API.get(`/api/whispers/conversations/${conversation._id}/messages`);
        setMessages(res.data || []);

        // Mark read only after the user actually opens this conversation.
        // The conversations list/inbox load should never mark messages as seen.
        try {
          await API.put(`/api/whispers/conversations/${conversation._id}/read`);
        } catch (readError) {
          logger.error(readError.response?.data || readError);
        }

        setConversations((prev) =>
          sortConversations(prev.map((item) => (item._id === conversation._id ? { ...item, unreadCount: 0 } : item)), currentUserId)
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
    [scrollToBottom, currentUserId]
  );

  const socketRef = useWhisperSocket({
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
    setMessageSearch("");
  }, [activeId]);

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

  const clearMedia = useCallback(() => {
    setMediaFile(null);
    setMediaPreview((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  const selectMedia = useCallback((file) => {
    if (!file) return;

    const isImage = file.type?.startsWith("image/");
    const isVideo = file.type?.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Only image and video files can be sent in Whispers.");
      return;
    }

    const limit = isImage ? 10 * 1024 * 1024 : 60 * 1024 * 1024;
    if (file.size > limit) {
      setError(isImage ? "Image too large. Max size is 10MB." : "Video too large. Max size is 60MB.");
      return;
    }

    clearMedia();
    setMediaFile(file);
    setMediaPreview({
      previewUrl: URL.createObjectURL(file),
      type: isVideo ? "video" : "image",
      name: file.name,
      size: file.size,
    });
  }, [clearMedia]);

  useEffect(() => () => clearMedia(), [clearMedia]);

  const finalizePendingMessage = useCallback((pendingId, realMessage) => {
    if (!pendingId || !realMessage?._id) return;

    setMessages((prev) => {
      const hasPending = prev.some((message) => String(message._id) === String(pendingId));
      const hasRealMessage = prev.some((message) => String(message._id) === String(realMessage._id));

      // If the socket already replaced the pending bubble with the real message,
      // keep the current list as-is. The previous version removed that real message,
      // which made quick messages appear and then disappear.
      if (!hasPending && hasRealMessage) return prev;

      if (hasPending) {
        return prev
          .filter((message) => String(message._id) !== String(realMessage._id))
          .map((message) => (String(message._id) === String(pendingId) ? realMessage : message));
      }

      return [...prev, realMessage];
    });
  }, []);

  const markPendingFailed = useCallback((pendingId, fallbackText = "Message failed. Tap retry.") => {
    if (!pendingId) return;
    setMessages((prev) =>
      prev.map((message) =>
        String(message._id) === String(pendingId)
          ? { ...message, status: "failed", isPending: true, errorMessage: fallbackText }
          : message
      )
    );
  }, []);

  const deliverPendingMessage = useCallback(
    async (pendingMessage, retryPayload) => {
      const conversationId = pendingMessage?.conversation || activeId;
      if (!conversationId || !pendingMessage?._id) return;

      const payload = {
        text: retryPayload?.text || "",
        replyTo: retryPayload?.replyToId || null,
      };

      try {
        pendingRequestCountRef.current += 1;
        setSending(true);
        setMediaUploading(Boolean(retryPayload?.mediaFile));

        if (retryPayload?.mediaFile) {
          const formData = new FormData();
          formData.append("file", retryPayload.mediaFile);
          const uploadRes = await API.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          payload.media = {
            url: uploadRes.data?.url,
            type: uploadRes.data?.type,
            name: retryPayload.mediaFile.name,
            size: retryPayload.mediaFile.size,
          };
        }

        socketRef.current?.emit("whisper-typing", { conversationId, typing: false });
        const res = await API.post(`/api/whispers/conversations/${conversationId}/messages`, payload);
        finalizePendingMessage(pendingMessage._id, res.data?.message);
        updateConversation(res.data?.conversation);
      } catch (err) {
        logger.error(err.response?.data || err);
        markPendingFailed(pendingMessage._id, "Message could not be sent. Tap retry.");
      } finally {
        pendingRequestCountRef.current = Math.max(0, pendingRequestCountRef.current - 1);
        setSending(pendingRequestCountRef.current > 0);
        setMediaUploading(false);
      }
    },
    [activeId, finalizePendingMessage, markPendingFailed, socketRef, updateConversation]
  );

  const sendMessage = useCallback(
    async (event) => {
      event.preventDefault();
      const cleanText = text.trim();
      if ((!cleanText && !mediaFile) || !activeId) return;

      const currentMediaFile = mediaFile;
      const currentMediaPreview = mediaPreview;
      const currentReplyTo = replyTo;
      const pendingMessage = buildPendingMessage({
        conversationId: activeId,
        currentUserId,
        text: cleanText,
        replyTo: currentReplyTo,
        mediaPreview: currentMediaPreview,
        mediaFile: currentMediaFile,
      });

      setMessages((prev) => [...prev, pendingMessage]);
      setText("");
      setReplyTo(null);
      setMediaFile(null);
      setMediaPreview(null);
      scrollToBottom();

      deliverPendingMessage(pendingMessage, pendingMessage._retryPayload);
    },
    [activeId, currentUserId, deliverPendingMessage, mediaFile, mediaPreview, replyTo, scrollToBottom, text]
  );

  const retryMessage = useCallback(
    (message) => {
      if (!message?._id || message.status !== "failed" || !message._retryPayload) return;
      setMessages((prev) =>
        prev.map((item) =>
          String(item._id) === String(message._id)
            ? { ...item, status: "sending", errorMessage: "" }
            : item
        )
      );
      scrollToBottom();
      deliverPendingMessage({ ...message, status: "sending" }, message._retryPayload);
    },
    [deliverPendingMessage, scrollToBottom]
  );

  const reactToMessage = useCallback(
    async (messageId, emoji) => {
      if (!activeId || !messageId || !emoji) return;

      try {
        const res = await API.put(`/api/whispers/conversations/${activeId}/messages/${messageId}/react`, { emoji });
        const updatedMessage = res.data?.message;
        if (updatedMessage?._id) {
          setMessages((prev) =>
            prev.map((message) => (String(message._id) === String(updatedMessage._id) ? { ...message, ...updatedMessage } : message))
          );
        }
      } catch (err) {
        logger.error(err.response?.data || err);
        setError("Reaction could not be updated.");
      }
    },
    [activeId]
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

  const filteredMessages = useMemo(() => {
    const term = messageSearch.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) => {
      const textMatch = String(message.text || "").toLowerCase().includes(term);
      const mediaMatch = String(message.media?.name || message.media?.type || "").toLowerCase().includes(term);
      const sharedMatch = [
        message.sharedVybe?.caption,
        message.sharedVybe?.type,
        message.sharedVybe?.mood,
        message.sharedVybe?.vybeTag,
        message.sharedVybe?.author?.name,
        message.sharedVybe?.author?.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
      return textMatch || mediaMatch || sharedMatch;
    });
  }, [messages, messageSearch]);

  const messageSearchCount = messageSearch.trim() ? filteredMessages.length : 0;

  const togglePinConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      try {
        const res = await API.put(`/api/whispers/conversations/${conversationId}/pin`);
        const updatedConversation = res.data?.conversation;
        if (updatedConversation?._id) updateConversation(updatedConversation, { keepUnread: true });
      } catch (err) {
        logger.error(err.response?.data || err);
        setError("Chat pin could not be updated.");
      }
    },
    [updateConversation]
  );

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
  };
}

export default useWhispers;
