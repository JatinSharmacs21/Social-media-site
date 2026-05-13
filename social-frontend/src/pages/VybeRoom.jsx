import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

function VybeRoom() {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const room = "general";

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [someoneTyping, setSomeoneTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  };

  const addMessageIfMissing = (newMessage) => {
    setMessages((prev) => {
      const exists = prev.some((msg) => msg._id === newMessage._id);
      if (exists) return prev;
      return [...prev, newMessage];
    });
  };

  const updateMessageInState = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
    );
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get("/api/vybe-room", authConfig);
      setMessages(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const emitTyping = (typing) => {
    socketRef.current?.emit("vybe-typing", {
      room,
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
    fetchMessages();

    const socketUrl =
      API.defaults?.baseURL?.replace("/api", "") || "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-vybe-room", {
        room,
        userId: currentUserId,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("vybe-message-created", (newMessage) => {
      addMessageIfMissing(newMessage);
    });

    socket.on("vybe-message-updated", (updatedMessage) => {
      updateMessageInState(updatedMessage);
    });

    socket.on("vybe-online-users", (count) => {
      setOnlineCount(count || 0);
    });

    socket.on("vybe-user-typing", (typing) => {
      setSomeoneTyping(Boolean(typing));

      if (typing) {
        setTimeout(() => {
          setSomeoneTyping(false);
        }, 1200);
      }
    });

    return () => {
      socket.emit("leave-vybe-room", {
        room,
        userId: currentUserId,
      });
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
      if (!text.trim()) return;

      const messageText = text.trim();
      setText("");
      emitTyping(false);

      const res = await API.post(
        "/api/vybe-room",
        {
          text: messageText,
          room,
        },
        authConfig
      );

      addMessageIfMissing(res.data);
      scrollToBottom();
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const sendReply = async (messageId) => {
    try {
      const value = replyText[messageId];

      if (!value || !value.trim()) return;

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
      console.log(error.response?.data || error);
    }
  };

  const reactMessage = async (messageId, reaction) => {
    try {
      const res = await API.put(
        `/api/vybe-room/${messageId}/react`,
        {
          reaction,
        },
        authConfig
      );

      updateMessageInState(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const ReactionButton = ({ emoji, count, onClick }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:border-white/20 active:scale-95 transition-all text-sm"
    >
      <span>{emoji}</span>
      <span className="ml-1 text-gray-300">{count || 0}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Vybe Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <div className="h-full max-w-[920px] mx-auto flex flex-col px-3 sm:px-5 pt-20 md:pt-8 pb-24 md:pb-8">
        <div className="shrink-0 mb-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-2xl">
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Vybe Room
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1">
                  Anonymous public discussions · General room
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm text-gray-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                    }`}
                  />
                  {connected ? "Live" : "Connecting"}
                </div>

                <div className="text-xs text-gray-500">
                  {onlineCount} online
                </div>
              </div>
            </div>

            <div className="relative z-10 sm:hidden mt-4 flex items-center gap-3 text-xs text-gray-400">
              <span className={connected ? "text-green-400" : "text-yellow-400"}>
                ● {connected ? "Live" : "Connecting"}
              </span>
              <span>•</span>
              <span>{onlineCount} online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-zinc-950/55 overflow-hidden shadow-2xl">
          <div className="h-full overflow-y-auto px-3 sm:px-5 py-5 space-y-5 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div>
                  <div className="text-5xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold mb-2">Start the first Vybe</h2>
                  <p className="text-gray-400">
                    Share something anonymously and let the room react.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className="group rounded-3xl border border-white/10 bg-black/35 hover:bg-white/[0.035] transition-all p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center shrink-0">
                        🎭
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-pink-300 truncate">
                          {msg.anonymousName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-gray-600 shrink-0">
                      #{String(msg._id).slice(-4)}
                    </span>
                  </div>

                  <p className="text-gray-100 whitespace-pre-wrap leading-7 break-words">
                    {msg.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <ReactionButton
                      emoji="❤️"
                      count={msg.reactions?.like?.length}
                      onClick={() => reactMessage(msg._id, "like")}
                    />
                    <ReactionButton
                      emoji="🔥"
                      count={msg.reactions?.fire?.length}
                      onClick={() => reactMessage(msg._id, "fire")}
                    />
                    <ReactionButton
                      emoji="😂"
                      count={msg.reactions?.laugh?.length}
                      onClick={() => reactMessage(msg._id, "laugh")}
                    />
                    <ReactionButton
                      emoji="👎"
                      count={msg.reactions?.dislike?.length}
                      onClick={() => reactMessage(msg._id, "dislike")}
                    />

                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === msg._id ? null : msg._id)
                      }
                      className="ml-auto px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all text-sm font-semibold"
                    >
                      {replyingTo === msg._id ? "Cancel" : "Reply"}
                    </button>
                  </div>

                  {replyingTo === msg._id && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-3 animate-[fadeIn_0.2s_ease-out]">
                      <div className="mb-2 text-xs text-gray-500 flex items-center justify-between">
                        <span>
                          Replying to{" "}
                          <span className="text-cyan-300 font-semibold">
                            {msg.anonymousName}
                          </span>
                        </span>

                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-500 hover:text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
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
                          placeholder="Write a reply..."
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm"
                        />

                        <button
                          onClick={() => sendReply(msg._id)}
                          disabled={!replyText[msg._id]?.trim()}
                          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 font-semibold hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.replies && msg.replies.length > 0 && (
                    <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                      {msg.replies.map((reply) => (
                        <div
                          key={reply._id}
                          className="rounded-2xl bg-white/[0.04] border border-white/5 p-3"
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <p className="text-sm font-semibold text-cyan-300">
                              {reply.anonymousName}
                            </p>

                            <span className="text-[11px] text-gray-600">
                              {reply.createdAt
                                ? new Date(reply.createdAt).toLocaleTimeString()
                                : ""}
                            </span>
                          </div>

                          <p className="text-sm text-gray-300 break-words">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {someoneTyping && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-xs text-gray-400">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
                Someone is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 mt-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-2xl p-3 sm:p-4 shadow-2xl">
            <div className="flex items-end gap-3">
              <textarea
                value={text}
                onChange={(e) => handleMainTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Drop an anonymous vybe..."
                className="flex-1 max-h-36 min-h-[52px] bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 outline-none resize-none focus:border-pink-400 text-white placeholder:text-gray-500"
              />

              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="h-[52px] px-5 sm:px-7 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 font-bold hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-lg shadow-pink-500/15"
              >
                Send
              </button>
            </div>

            <p className="text-[11px] text-gray-600 mt-2 px-1">
              Press Enter to send · Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VybeRoom;
