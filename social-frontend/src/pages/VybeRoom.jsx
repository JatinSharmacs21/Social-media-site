import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import logger from "../utils/logger";
import { SOCKET_URL } from "../config/env";

const fallbackRooms = [
  {
    id: "general",
    label: "General",
    accent: "from-pink-500 to-cyan-400",
    prompt: "Share a thought, question, or moment with the room.",
  },
  {
    id: "deep",
    label: "Deep",
    accent: "from-indigo-500 to-cyan-400",
    prompt: "What is something you have been thinking about lately?",
  },
  {
    id: "funny",
    label: "Funny",
    accent: "from-amber-400 to-pink-500",
    prompt: "Drop something that made you laugh today.",
  },
  {
    id: "chaos",
    label: "Chaos",
    accent: "from-fuchsia-500 to-orange-400",
    prompt: "What is the most random thing happening right now?",
  },
  {
    id: "late-night",
    label: "Late Night",
    accent: "from-violet-500 to-blue-400",
    prompt: "What is on your mind tonight?",
  },
  {
    id: "college",
    label: "College",
    accent: "from-emerald-400 to-cyan-400",
    prompt: "Share a campus, class, exam, or friend-circle moment.",
  },
];

const reactionItems = [
  { key: "felt", label: "Felt", emoji: "♡" },
  { key: "real", label: "Real", emoji: "✦" },
  { key: "same", label: "Same", emoji: "↺" },
  { key: "chaos", label: "Chaos", emoji: "⚡" },
  { key: "needed", label: "Needed", emoji: "✓" },
];

function VybeRoom() {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const [searchParams] = useSearchParams();

  const requestedRoom = searchParams.get("room");
  const initialRoom = fallbackRooms.some((room) => room.id === requestedRoom)
    ? requestedRoom
    : "general";

  const [rooms, setRooms] = useState(fallbackRooms);
  const [activeRoom, setActiveRoom] = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingReply, setSavingReply] = useState({});
  const [connected, setConnected] = useState(false);
  const [onlineByRoom, setOnlineByRoom] = useState({});
  const [typingByRoom, setTypingByRoom] = useState({});
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [reportingMessage, setReportingMessage] = useState({});
  const [deletingMessage, setDeletingMessage] = useState({});
  const [deletingReply, setDeletingReply] = useState({});

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const joinedRoomRef = useRef(initialRoom);

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: "Bearer " + token,
      },
    }),
    [token]
  );

  const roomMeta = useMemo(
    () => rooms.find((room) => room.id === activeRoom) || fallbackRooms[0],
    [rooms, activeRoom]
  );

  const onlineCount = onlineByRoom[activeRoom] || 0;
  const someoneTyping = Boolean(typingByRoom[activeRoom]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);
  };

  const addMessageIfMissing = (newMessage) => {
    if (!newMessage?._id || newMessage.room !== activeRoom) return;

    setMessages((prev) => {
      const exists = prev.some((msg) => msg._id === newMessage._id);
      if (exists) return prev;
      return [...prev, newMessage];
    });
  };

  const updateMessageInState = (updatedMessage) => {
    if (!updatedMessage?._id || updatedMessage.room !== activeRoom) return;

    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  };

  const fetchRooms = async () => {
    try {
      const res = await API.get("/api/vybe-room/rooms", authConfig);
      if (Array.isArray(res.data) && res.data.length) {
        const withAccent = res.data.map((room, index) => ({
          ...room,
          accent: fallbackRooms[index]?.accent || fallbackRooms[0].accent,
        }));
        setRooms(withAccent);
      }
    } catch (error) {
      logger.error(error.response?.data || error);
    }
  };

  const fetchMessages = async (roomId = activeRoom) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/vybe-room?room=${roomId}`, authConfig);
      setMessages(Array.isArray(res.data) ? res.data : []);
      scrollToBottom();
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = (roomId) => {
    const socket = socketRef.current;
    if (!socket) return;

    if (joinedRoomRef.current) {
      socket.emit("leave-vybe-room", { room: joinedRoomRef.current });
    }

    joinedRoomRef.current = roomId;
    socket.emit("join-vybe-room", { room: roomId });
  };

  const changeRoom = (roomId) => {
    if (roomId === activeRoom) return;
    setActiveRoom(roomId);
    setReplyingTo(null);
    setText("");
    setMessages([]);
    setOpenMessageMenu(null);
    joinRoom(roomId);
    fetchMessages(roomId);
  };

  const emitTyping = (typing) => {
    socketRef.current?.emit("vybe-typing", {
      room: activeRoom,
      typing,
    });
  };

  const handleMainTextChange = (value) => {
    setText(value);
    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 900);
  };

  useEffect(() => {
    fetchRooms();
    fetchMessages(initialRoom);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-vybe-room", { room: joinedRoomRef.current || "general" });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("vybe-message-created", (newMessage) => {
      addMessageIfMissing(newMessage);
      scrollToBottom();
    });

    socket.on("vybe-message-updated", (updatedMessage) => {
      updateMessageInState(updatedMessage);
    });

    socket.on("vybe-online-users", (payload) => {
      if (typeof payload === "number") {
        setOnlineByRoom((prev) => ({ ...prev, [joinedRoomRef.current]: payload }));
        return;
      }

      if (payload?.room) {
        setOnlineByRoom((prev) => ({ ...prev, [payload.room]: payload.count || 0 }));
      }
    });

    socket.on("vybe-user-typing", (payload) => {
      const roomId = payload?.room || joinedRoomRef.current || "general";
      setTypingByRoom((prev) => ({ ...prev, [roomId]: Boolean(payload?.typing ?? payload) }));

      if (payload?.typing ?? payload) {
        setTimeout(() => {
          setTypingByRoom((prev) => ({ ...prev, [roomId]: false }));
        }, 1300);
      }
    });

    return () => {
      socket.emit("leave-vybe-room", { room: joinedRoomRef.current || "general" });
      socket.disconnect();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = async () => {
    try {
      if (!text.trim() || sending) return;

      const messageText = text.trim();
      setText("");
      setSending(true);
      emitTyping(false);

      const res = await API.post(
        "/api/vybe-room",
        {
          text: messageText,
          room: activeRoom,
        },
        authConfig
      );

      addMessageIfMissing(res.data);
      scrollToBottom();
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (messageId) => {
    const value = replyText[messageId];
    if (!value || !value.trim() || savingReply[messageId]) return;

    try {
      setSavingReply((prev) => ({ ...prev, [messageId]: true }));
      const res = await API.post(
        `/api/vybe-room/${messageId}/reply`,
        {
          text: value.trim(),
        },
        authConfig
      );

      updateMessageInState(res.data);

      setReplyText((prev) => ({
        ...prev,
        [messageId]: "",
      }));

      setReplyingTo(null);
      scrollToBottom();
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setSavingReply((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const reactMessage = async (messageId, reaction) => {
    try {
      const currentMessage = messages.find((msg) => msg._id === messageId);
      if (!currentMessage) return;

      const optimistic = { ...currentMessage, reactions: { ...(currentMessage.reactions || {}) } };

      reactionItems.forEach((item) => {
        optimistic.reactions[item.key] = (optimistic.reactions[item.key] || []).filter(
          (id) => (typeof id === "string" ? id : id?._id) !== currentUserId
        );
      });
      optimistic.reactions[reaction] = [...(optimistic.reactions[reaction] || []), currentUserId];
      updateMessageInState(optimistic);

      const res = await API.put(
        `/api/vybe-room/${messageId}/react`,
        { reaction },
        authConfig
      );

      updateMessageInState(res.data);
    } catch (error) {
      logger.error(error.response?.data || error);
      fetchMessages(activeRoom);
    }
  };


  const getItemUserId = (item) => {
    if (!item?.user) return "";
    return typeof item.user === "string" ? item.user : item.user?._id || item.user?.id || "";
  };

  const isOwnItem = (item) => getItemUserId(item)?.toString() === currentUserId?.toString();

  const copyMessage = async (msg) => {
    try {
      if (!msg?.text || msg.isDeleted) return;
      await navigator.clipboard.writeText(msg.text);
      setCopiedMessageId(msg._id);
      setOpenMessageMenu(null);
      setTimeout(() => setCopiedMessageId(null), 1300);
    } catch (error) {
      logger.error("Copy message failed:", error);
    }
  };

  const copyReply = async (reply) => {
    try {
      if (!reply?.text || reply.isDeleted) return;
      await navigator.clipboard.writeText(reply.text);
    } catch (error) {
      logger.error("Copy reply failed:", error);
    }
  };

  const reportMessage = async (messageId) => {
    try {
      if (!messageId || reportingMessage[messageId]) return;
      setReportingMessage((prev) => ({ ...prev, [messageId]: true }));
      await API.post(
        `/api/vybe-room/${messageId}/report`,
        { reason: "Reported from Vybe Room" },
        authConfig
      );
      setOpenMessageMenu(null);
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setReportingMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const removeMessage = async (messageId) => {
    try {
      if (!messageId || deletingMessage[messageId]) return;
      setDeletingMessage((prev) => ({ ...prev, [messageId]: true }));
      const res = await API.delete(`/api/vybe-room/${messageId}`, authConfig);
      updateMessageInState(res.data);
      setOpenMessageMenu(null);
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setDeletingMessage((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const removeReply = async (messageId, replyId) => {
    const key = `${messageId}-${replyId}`;

    try {
      if (!messageId || !replyId || deletingReply[key]) return;
      setDeletingReply((prev) => ({ ...prev, [key]: true }));
      const res = await API.delete(
        `/api/vybe-room/${messageId}/reply/${replyId}`,
        authConfig
      );
      updateMessageInState(res.data);
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setDeletingReply((prev) => ({ ...prev, [key]: false }));
    }
  };

  const userReacted = (msg, reaction) =>
    msg.reactions?.[reaction]?.some((id) =>
      (typeof id === "string" ? id : id?._id) === currentUserId
    );

  const ReactionButton = ({ msg, item }) => {
    const count = msg.reactions?.[item.key]?.length || 0;
    const active = userReacted(msg, item.key);

    return (
      <button
        onClick={() => reactMessage(msg._id, item.key)}
        title={item.label}
        className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black transition-all active:scale-95 ${
          active
            ? "border-pink-300/40 bg-pink-500/15 text-pink-100 shadow-[0_0_16px_rgba(236,72,153,0.16)]"
            : "border-white/10 bg-white/[0.045] text-white/65 hover:border-white/20 hover:bg-white/[0.08]"
        }`}
      >
        <span>{item.emoji}</span>
        {count > 0 && <span className="ml-1 text-white/70">{count}</span>}
      </button>
    );
  };

  const visibleReplies = (msg) => {
    const replies = msg.replies || [];
    return expandedReplies[msg._id] ? replies : replies.slice(0, 2);
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-[calc(100svh-148px)] md:h-screen bg-black text-white overflow-hidden">
        <div className="relative h-full max-w-[940px] mx-auto flex flex-col px-3 sm:px-5 pt-2 md:pt-6 pb-2 md:pb-6">
          <div className="pointer-events-none absolute -top-20 right-0 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-20 left-0 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="shrink-0 mb-2 overflow-hidden rounded-[1.15rem] border border-white/10 bg-zinc-950/75 p-2.5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="h-7 w-40 rounded-xl bg-gradient-to-r from-pink-500/45 via-purple-400/35 to-cyan-400/35 animate-pulse" />
                <div className="mt-2 h-3 w-56 max-w-[70vw] rounded-full bg-white/10 animate-pulse" />
              </div>
              <div className="h-10 w-24 rounded-2xl border border-white/10 bg-white/[0.055] animate-pulse" />
            </div>

            <div className="mt-3 flex gap-2 overflow-hidden">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`h-9 shrink-0 rounded-full border border-white/10 animate-pulse ${
                    item === 0
                      ? "w-24 bg-gradient-to-r from-pink-500/45 to-cyan-400/35"
                      : "w-20 bg-white/[0.055]"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-white/10 bg-zinc-950/35 p-3">
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500/25" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-36 rounded-full bg-white/15" />
                      <div className="mt-2 h-3 w-16 rounded-full bg-white/[0.08]" />
                    </div>
                  </div>
                  <div className="mt-4 h-4 w-2/3 rounded-full bg-white/12" />
                  <div className="mt-4 flex gap-2">
                    {[0, 1, 2, 3].map((chip) => (
                      <div key={chip} className="h-8 w-12 rounded-full bg-white/[0.07]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 shrink-0 rounded-[1.35rem] border border-white/10 bg-zinc-950/80 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="h-12 flex-1 rounded-2xl bg-white/[0.07] animate-pulse" />
              <div className="h-12 w-16 rounded-2xl bg-gradient-to-r from-pink-500/35 to-cyan-400/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-148px)] md:h-screen bg-black text-white overflow-hidden">
      <div className="h-full max-w-[940px] mx-auto flex flex-col px-3 sm:px-5 pt-2 md:pt-6 pb-2 md:pb-6">
        <div className="shrink-0 mb-2">
          <div className="relative overflow-hidden rounded-[1.15rem] border border-white/10 bg-zinc-950/75 p-2.5 shadow-xl backdrop-blur-xl">
            <div className="absolute -top-24 -right-16 h-36 w-36 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Vybe Room
                  </h1>
                  <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-0.5 text-[10px] font-bold text-white/55">
                    {roomMeta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] sm:text-xs text-gray-400 line-clamp-1">
                  {roomMeta.prompt}
                </p>
              </div>

              <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1.5 text-right">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/75">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      connected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                    }`}
                  />
                  {onlineCount} tuned in
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {rooms.map((room) => {
                const active = room.id === activeRoom;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => changeRoom(room.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition-all active:scale-95 ${
                      active
                        ? `border-white/20 bg-gradient-to-r ${room.accent} text-white shadow-lg shadow-pink-500/15`
                        : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                    }`}
                  >
                    {room.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-zinc-950/25 shadow-xl">
          <div className="h-full overflow-y-auto px-1.5 sm:px-4 py-2 space-y-2 scroll-smooth overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div className="max-w-sm rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 text-3xl">
                    ✦
                  </div>
                  <h2 className="text-base font-black mb-1.5">Start the conversation</h2>
                  <p className="text-sm text-gray-400">{roomMeta.prompt}</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className="group rounded-[1.15rem] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2.5 sm:p-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition-all hover:bg-white/[0.05]"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-pink-500/25 via-purple-500/25 to-cyan-500/25 text-sm font-black">
                        {msg.anonymousName?.slice(0, 1) || "V"}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-black text-white/90">
                          {msg.anonymousName}
                        </h3>
                        <p className="text-[10px] text-white/38">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>

                    {!msg.isDeleted && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMessageMenu(openMessageMenu === msg._id ? null : msg._id)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-white/55 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
                          title="Message options"
                        >
                          ⋯
                        </button>

                        {openMessageMenu === msg._id && (
                          <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
                            <button
                              type="button"
                              onClick={() => copyMessage(msg)}
                              className="block w-full px-4 py-3 text-left text-xs font-bold text-white/80 hover:bg-white/[0.07]"
                            >
                              {copiedMessageId === msg._id ? "Copied" : "Copy"}
                            </button>
                            <button
                              type="button"
                              onClick={() => reportMessage(msg._id)}
                              disabled={reportingMessage[msg._id]}
                              className="block w-full px-4 py-3 text-left text-xs font-bold text-amber-100/85 hover:bg-amber-500/10 disabled:opacity-50"
                            >
                              {reportingMessage[msg._id] ? "Reporting..." : "Report"}
                            </button>
                            {isOwnItem(msg) && (
                              <button
                                type="button"
                                onClick={() => removeMessage(msg._id)}
                                disabled={deletingMessage[msg._id]}
                                className="block w-full px-4 py-3 text-left text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {deletingMessage[msg._id] ? "Removing..." : "Delete"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p
                    className={`break-words whitespace-pre-wrap text-[15px] leading-5 ${
                      msg.isDeleted ? "italic text-gray-500" : "text-gray-100"
                    }`}
                  >
                    {msg.isDeleted ? "This message was removed" : msg.text}
                  </p>

                  {!msg.isDeleted && (
                    <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {reactionItems.map((item) => (
                      <ReactionButton key={item.key} msg={msg} item={item} />
                    ))}

                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === msg._id ? null : msg._id)
                      }
                      className="ml-auto shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] font-black text-cyan-200 transition-all hover:bg-cyan-400/16 active:scale-95"
                    >
                      {replyingTo === msg._id ? "Cancel" : `Reply${msg.replies?.length ? ` · ${msg.replies.length}` : ""}`}
                    </button>
                    </div>
                  )}

                  {!msg.isDeleted && replyingTo === msg._id && (
                    <div className="mt-2.5 rounded-2xl border border-white/10 bg-black/35 p-2">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
                        <span>
                          Replying to <span className="font-bold text-cyan-200">{msg.anonymousName}</span>
                        </span>

                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-500 hover:text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText[msg._id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [msg._id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              sendReply(msg._id);
                            }
                          }}
                          placeholder="Write a reply"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-cyan-300/50"
                        />

                        <button
                          onClick={() => sendReply(msg._id)}
                          disabled={!replyText[msg._id]?.trim() || savingReply[msg._id]}
                          className="rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 px-3.5 py-2 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
                        >
                          {savingReply[msg._id] ? "..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!msg.isDeleted && msg.replies && msg.replies.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                      {visibleReplies(msg).map((reply) => (
                        <div
                          key={reply._id}
                          className="rounded-xl border border-white/[0.055] bg-black/25 p-2.5"
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-black text-cyan-200">
                              {reply.anonymousName}
                            </p>

                            <div className="flex shrink-0 items-center gap-2 text-[10px] text-gray-600">
                              <span>
                                {reply.createdAt
                                  ? new Date(reply.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                              {!reply.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => copyReply(reply)}
                                  className="rounded-full border border-white/10 px-2 py-1 text-white/45 hover:text-white"
                                >
                                  Copy
                                </button>
                              )}
                              {!reply.isDeleted && (isOwnItem(reply) || isOwnItem(msg)) && (
                                <button
                                  type="button"
                                  onClick={() => removeReply(msg._id, reply._id)}
                                  disabled={deletingReply[`${msg._id}-${reply._id}`]}
                                  className="rounded-full border border-red-300/15 px-2 py-1 text-red-300/80 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  {deletingReply[`${msg._id}-${reply._id}`] ? "..." : "Delete"}
                                </button>
                              )}
                            </div>
                          </div>

                          <p
                            className={`break-words text-[13px] leading-5 ${
                              reply.isDeleted ? "italic text-gray-500" : "text-gray-300"
                            }`}
                          >
                            {reply.isDeleted ? "This reply was removed" : reply.text}
                          </p>
                        </div>
                      ))}

                      {msg.replies.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [msg._id]: !prev[msg._id],
                            }))
                          }
                          className="text-xs font-black text-indigo-200 hover:text-white"
                        >
                          {expandedReplies[msg._id]
                            ? "Show fewer replies"
                            : `View ${msg.replies.length - 2} more replies`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {someoneTyping && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-gray-400">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0.3s]" />
                </span>
                Someone is typing
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 mt-2">
          <div className="rounded-[1.15rem] border border-white/10 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-2xl">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => handleMainTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${roomMeta.label}`}
                className="max-h-20 min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-pink-300/50"
              />

              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="h-[42px] rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-4 text-sm font-black shadow-lg shadow-pink-500/15 transition-all active:scale-95 disabled:opacity-40"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>

            <p className="hidden mt-1 px-1 text-[10px] text-gray-600">
              Anonymous room · Enter sends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VybeRoom;