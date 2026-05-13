import React, { useEffect, useState } from "react";
import API from "../services/api";

function VybeRoom() {
  const token = localStorage.getItem("token");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(
        "/api/vybe-room",
        authConfig
      );

      setMessages(res.data);
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const sendMessage = async () => {
    try {
      if (!text.trim()) return;

      const res = await API.post(
        "/api/vybe-room",
        {
          text,
        },
        authConfig
      );

      setMessages((prev) => [...prev, res.data]);

      setText("");
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
          text: value,
        },
        authConfig
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? res.data : msg
        )
      );

      setReplyText((prev) => ({
        ...prev,
        [messageId]: "",
      }));

    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const reactMessage = async (
    messageId,
    reaction
  ) => {
    try {
      const res = await API.put(
        `/api/vybe-room/${messageId}/react`,
        {
          reaction,
        },
        authConfig
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? res.data : msg
        )
      );
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Vybe Room...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 md:pl-[110px]">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Vybe Room
          </h1>

          <p className="text-gray-400 mt-2">
            Anonymous public discussions
          </p>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-3xl p-4 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
        }}
            placeholder="Share your thoughts anonymously..."
            className="w-full h-28 bg-transparent outline-none resize-none text-white placeholder:text-gray-500"
           />

          <div className="flex justify-end mt-4">
            <button
              onClick={sendMessage}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 font-semibold hover:scale-105 transition-all"
            >
              Send
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pink-300">
                  {msg.anonymousName}
                </h3>

                <span className="text-xs text-gray-500">
                  {new Date(
                    msg.createdAt
                  ).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-gray-100 whitespace-pre-wrap leading-7">
                {msg.text}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() =>
                    reactMessage(
                      msg._id,
                      "like"
                    )
                  }
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm"
                >
                  ❤️{" "}
                  {msg.reactions?.like?.length || 0}
                </button>

                <button
                  onClick={() =>
                    reactMessage(
                      msg._id,
                      "fire"
                    )
                  }
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm"
                >
                  🔥{" "}
                  {msg.reactions?.fire?.length || 0}
                </button>

                <button
                  onClick={() =>
                    reactMessage(
                      msg._id,
                      "laugh"
                    )
                  }
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm"
                >
                  😂{" "}
                  {msg.reactions?.laugh?.length || 0}
                </button>

                <button
                  onClick={() =>
                    reactMessage(
                      msg._id,
                      "dislike"
                    )
                  }
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm"
                >
                  👎{" "}
                  {msg.reactions?.dislike?.length || 0}
                </button>

                <button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === msg._id
                        ? null
                        : msg._id
                    )
                  }
                  className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-sm"
                >
                  Reply
                </button>
              </div>

              {replyingTo === msg._id && (
                <div className="mt-4">
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
                    className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 outline-none"
                />

                  <button
                    onClick={() =>
                      sendReply(msg._id)
                    }
                    className="mt-3 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 transition-all"
                  >
                    Send Reply
                  </button>
                </div>
              )}

              {msg.replies &&
                msg.replies.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                    {msg.replies.map((reply) => (
                      <div
                        key={reply._id}
                        className="bg-black/40 rounded-2xl p-3"
                      >
                        <p className="text-sm font-semibold text-cyan-300">
                          {
                            reply.anonymousName
                          }
                        </p>

                        <p className="text-sm text-gray-300 mt-1">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VybeRoom;