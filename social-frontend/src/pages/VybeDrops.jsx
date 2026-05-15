import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const socketUrl =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const tagStyles = {
  all: { gradient: "from-pink-500 to-indigo-500", label: "All", icon: "🔥" },
  deep: { gradient: "from-indigo-500 to-purple-600", label: "Deep", icon: "🧠" },
  funny: { gradient: "from-yellow-400 to-orange-500", label: "Funny", icon: "😂" },
  chaos: { gradient: "from-red-500 to-pink-600", label: "Chaos", icon: "⚡" },
  chill: { gradient: "from-cyan-400 to-blue-500", label: "Chill", icon: "🌊" },
  creative: { gradient: "from-pink-500 to-violet-600", label: "Creative", icon: "✨" },
  lateNight: { gradient: "from-purple-700 to-indigo-900", label: "Late Night", icon: "🌙" },
};

const reactions = [
  { type: "felt", label: "Felt", icon: "❤️" },
  { type: "deep", label: "Deep", icon: "🧠" },
  { type: "funny", label: "Funny", icon: "😂" },
  { type: "chaos", label: "Wild", icon: "⚡" },
  { type: "relatable", label: "Same", icon: "🫂" },
];

const anonymousNames = [
  "Silent Soul",
  "Night Owl",
  "Hidden Vybe",
  "Unknown Human",
  "Moon Mind",
  "Lost Signal",
];

function getAnonName(id = "") {
  const last = id?.charCodeAt(id.length - 1) || 0;
  return anonymousNames[last % anonymousNames.length] || "Anonymous";
}

function VybeDrops() {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const [selectedDrop, setSelectedDrop] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [openDropIds, setOpenDropIds] = useState([]);
  const [repliesByDrop, setRepliesByDrop] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    fetchDrops();
  }, []);

  useEffect(() => {
    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("drop-reply-created", ({ dropId, reply }) => {
      setRepliesByDrop((prev) => {
        const oldReplies = prev[dropId] || [];
        const alreadyExists = oldReplies.some((item) => item._id === reply._id);

        if (alreadyExists) return prev;

        return {
          ...prev,
          [dropId]: [reply, ...oldReplies],
        };
      });

      setDrops((prev) =>
        prev.map((drop) =>
          drop._id === dropId
            ? { ...drop, replyCount: (drop.replyCount || 0) + 1 }
            : drop
        )
      );
    });

    socketRef.current.on("drop-reply-reacted", ({ dropId, reply }) => {
      setRepliesByDrop((prev) => ({
        ...prev,
        [dropId]: (prev[dropId] || []).map((item) =>
          item._id === reply._id ? reply : item
        ),
      }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchDrops = async () => {
    try {
      const res = await API.get("/api/posts/drops");
      setDrops(res.data || []);
    } catch (err) {
      console.log("Drops error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (dropId) => {
    try {
      setLoadingReplies((prev) => ({ ...prev, [dropId]: true }));

      const res = await API.get(`/api/posts/drops/${dropId}/replies`);

      setRepliesByDrop((prev) => ({
        ...prev,
        [dropId]: res.data || [],
      }));
    } catch (err) {
      console.log("Replies error:", err.response?.data || err.message);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [dropId]: false }));
    }
  };

  const filteredDrops = useMemo(() => {
    if (activeTag === "all") return drops;
    return drops.filter((drop) => drop.vybeTag === activeTag);
  }, [drops, activeTag]);

  const featuredDrop = activeTag === "all" ? drops[0] : null;

  const visibleDrops = useMemo(() => {
    const list =
      activeTag === "all" && featuredDrop
        ? filteredDrops.filter((drop) => drop._id !== featuredDrop._id)
        : filteredDrops;

    return list.slice(0, visibleCount);
  }, [filteredDrops, featuredDrop, activeTag, visibleCount]);

  const toggleReplies = async (dropId) => {
    const isOpen = openDropIds.includes(dropId);

    if (isOpen) {
      setOpenDropIds((prev) => prev.filter((id) => id !== dropId));
      socketRef.current?.emit("leave-drop", dropId);
      return;
    }

    setOpenDropIds((prev) => [...prev, dropId]);
    socketRef.current?.emit("join-drop", dropId);

    if (!repliesByDrop[dropId]) {
      await fetchReplies(dropId);
    }
  };

  const openReplyModal = (drop, anonymous = false) => {
    setSelectedDrop(drop);
    setIsAnonymous(anonymous);
    setReplyText("");
  };

  const closeReplyModal = () => {
    setSelectedDrop(null);
    setIsAnonymous(false);
    setReplyText("");
  };

  const submitReply = async () => {
    if (!replyText.trim() || !selectedDrop || submitting) return;

    try {
      setSubmitting(true);

      const res = await API.post(`/api/posts/drops/${selectedDrop._id}/reply`, {
        caption: replyText.trim(),
        isAnonymous,
      });

      const dropId = selectedDrop._id;

      setOpenDropIds((prev) => (prev.includes(dropId) ? prev : [...prev, dropId]));
      socketRef.current?.emit("join-drop", dropId);

      setRepliesByDrop((prev) => {
        const oldReplies = prev[dropId] || [];
        const alreadyExists = oldReplies.some((item) => item._id === res.data._id);

        return {
          ...prev,
          [dropId]: alreadyExists ? oldReplies : [res.data, ...oldReplies],
        };
      });

      setDrops((prev) =>
        prev.map((drop) =>
          drop._id === dropId
            ? { ...drop, replyCount: (drop.replyCount || 0) + 1 }
            : drop
        )
      );

      closeReplyModal();
    } catch (err) {
      console.log("Reply error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Reply failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reactToReply = async (replyId, reactionType, dropId) => {
    try {
      const res = await API.post(`/api/posts/drops/reply/${replyId}/react`, {
        type: reactionType,
      });

      setRepliesByDrop((prev) => ({
        ...prev,
        [dropId]: (prev[dropId] || []).map((reply) =>
          reply._id === replyId ? res.data : reply
        ),
      }));
    } catch (err) {
      console.log("Reaction error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Reaction failed");
    }
  };

  const renderReplyCard = (reply, dropId) => {
    const isAnon = reply.isAnonymous;
    const displayName = isAnon
      ? getAnonName(reply._id)
      : `@${reply.user?.username || "user"}`;

    return (
      <div
        key={reply._id}
        className="bg-black/40 border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center font-black">
            {isAnon ? "?" : (reply.user?.username || "U")[0]?.toUpperCase()}
          </div>

          <div>
            <p className="font-bold text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">
              {isAnon ? "Anonymous reply" : "Vybe reply"}
            </p>
          </div>
        </div>

        <p className="text-gray-100 leading-relaxed">{reply.caption}</p>

        <div className="flex gap-2 flex-wrap mt-4">
          {reactions.map((reaction) => {
            const count =
              reply.vybeReactions?.filter((r) => r.type === reaction.type)
                .length || 0;

            return (
              <button
                key={reaction.type}
                onClick={() => reactToReply(reply._id, reaction.type, dropId)}
                className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 rounded-full px-3 py-1.5 transition"
              >
                {reaction.icon} {reaction.label} {count > 0 ? count : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDropCard = (drop, featured = false) => {
    const tag = tagStyles[drop.vybeTag] || tagStyles.chill;
    const replies = repliesByDrop[drop._id] || [];
    const isOpen = openDropIds.includes(drop._id);

    return (
      <div
        key={drop._id}
        className={`group bg-zinc-950/95 border border-white/10 ${
          featured ? "rounded-[34px] p-6 sm:p-8" : "rounded-[28px] p-5 sm:p-6"
        } shadow-xl hover:border-pink-500/60 transition-all relative overflow-hidden`}
      >
        <div
          className={`absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-r ${tag.gradient} opacity-20 blur-3xl rounded-full group-hover:opacity-35 transition`}
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${tag.gradient} flex items-center justify-center font-black shadow-lg text-lg`}
              >
                V
              </div>

              <div className="min-w-0">
                <h3 className="font-bold truncate">
                  @{drop.user?.username || "vybe"}
                </h3>
                <p className="text-xs text-gray-400">
                  {featured ? "Featured Drop" : "Official Vybe Drop"}
                </p>
              </div>
            </div>

            <span
              className={`text-xs px-3 py-1.5 rounded-full bg-gradient-to-r ${tag.gradient} font-bold shadow-lg whitespace-nowrap`}
            >
              {tag.icon} {tag.label}
            </span>
          </div>

          <p
            className={`${
              featured ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"
            } font-black leading-snug mb-6`}
          >
            {drop.caption}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => openReplyModal(drop, false)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-5 py-3 rounded-2xl font-bold hover:scale-[1.03] active:scale-95 transition-all shadow-lg"
            >
              Reply
            </button>

            <button
              onClick={() => openReplyModal(drop, true)}
              className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all"
            >
              Anonymous
            </button>

            <button
              onClick={() => toggleReplies(drop._id)}
              className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all"
            >
              {isOpen ? "Hide replies" : "Read replies"} ·{" "}
              {drop.replyCount || replies.length || 0}
            </button>
          </div>

          {isOpen && (
            <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
              {loadingReplies[drop._id] && !replies.length ? (
                <p className="text-gray-500 text-sm">Loading replies...</p>
              ) : replies.length ? (
                <>
                  {replies.map((reply) => renderReplyCard(reply, drop._id))}
                  <button
                    onClick={() => openReplyModal(drop, false)}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-3 font-semibold transition"
                  >
                    Add another reply
                  </button>
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-400">
                  No replies yet. Be the first one to share your vybe.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-5 md:px-8 pt-20 md:pt-8 pb-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-6">
          <div className="bg-zinc-950/90 border border-white/10 rounded-[34px] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-20 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

            <div className="relative">
              <p className="text-sm text-pink-400 font-bold mb-2 tracking-wide">
                🔥 DAILY CONVERSATION STARTERS
              </p>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                Vybe Drops
              </h1>

              <p className="text-gray-400 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
                Real prompts, anonymous thoughts, live replies and vibe reactions — built to make the community feel alive.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
          {Object.keys(tagStyles).map((tagKey) => {
            const tag = tagStyles[tagKey];

            return (
              <button
                key={tagKey}
                onClick={() => {
                  setActiveTag(tagKey);
                  setVisibleCount(6);
                }}
                className={`shrink-0 px-4 py-2 rounded-full border text-sm font-bold transition ${
                  activeTag === tagKey
                    ? `bg-gradient-to-r ${tag.gradient} border-transparent`
                    : "bg-white/5 border-white/10 text-gray-300"
                }`}
              >
                {tag.icon} {tag.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-56 bg-zinc-950 border border-white/10 rounded-[28px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {featuredDrop && activeTag === "all" && (
              <div className="mb-5">{renderDropCard(featuredDrop, true)}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {visibleDrops.map((drop) => renderDropCard(drop))}
            </div>

            {visibleDrops.length <
              (activeTag === "all" && featuredDrop
                ? filteredDrops.length - 1
                : filteredDrops.length) && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-6 py-3 font-bold transition"
                >
                  Load more drops
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedDrop && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-t-[30px] sm:rounded-[30px] p-5 sm:p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-pink-500/20 blur-3xl rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-pink-400 font-bold mb-1">
                    REPLY TO DROP
                  </p>
                  <h2 className="text-2xl font-black">Share your vybe</h2>
                </div>

                <button
                  onClick={closeReplyModal}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                <p className="text-base sm:text-lg font-bold leading-snug">
                  {selectedDrop.caption}
                </p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write something real..."
                maxLength={280}
                className="w-full h-36 bg-black/60 border border-white/10 rounded-2xl p-4 outline-none focus:border-pink-500 resize-none text-white placeholder:text-gray-500"
              />

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>
                  {isAnonymous
                    ? "Posting as Anonymous"
                    : "Posting with your profile"}
                </span>
                <span>{replyText.length}/280</span>
              </div>

              <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`px-4 py-3 rounded-2xl border font-semibold transition ${
                    isAnonymous
                      ? "bg-pink-500 border-pink-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-200"
                  }`}
                >
                  {isAnonymous ? "Anonymous ON" : "Anonymous OFF"}
                </button>

                <button
                  onClick={submitReply}
                  disabled={submitting || !replyText.trim()}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 rounded-2xl font-bold hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VybeDrops;