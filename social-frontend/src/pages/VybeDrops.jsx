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

const getAnonName = (id = "") => {
  const last = id?.charCodeAt(id.length - 1) || 0;
  return anonymousNames[last % anonymousNames.length] || "Anonymous";
};

const getReactionCount = (reply, type) =>
  reply?.vybeReactions?.filter((r) => r.type === type).length || 0;

const getReactionUserId = (reaction) =>
  typeof reaction.user === "object"
    ? reaction.user?._id || reaction.user?.id
    : reaction.user;

const hasUserReacted = (reply, type, userId) =>
  reply?.vybeReactions?.some(
    (r) =>
      getReactionUserId(r)?.toString() === userId?.toString() &&
      r.type === type
  ) || false;

function VybeDrops() {
  const socketRef = useRef(null);
  const userId = localStorage.getItem("userId");

  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const [openDropIds, setOpenDropIds] = useState([]);
  const [repliesByDrop, setRepliesByDrop] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const [selectedDrop, setSelectedDrop] = useState(null);
  const [detailDrop, setDetailDrop] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reactingId, setReactingId] = useState(null);
  const [reactionBurst, setReactionBurst] = useState(null);

  const [nestedComposer, setNestedComposer] = useState(null);
  const [nestedText, setNestedText] = useState("");
  const [nestedAnonymous, setNestedAnonymous] = useState(false);
  const [nestedSubmitting, setNestedSubmitting] = useState(false);
  const [openThreads, setOpenThreads] = useState({});

  useEffect(() => {
    fetchDrops();
  }, []);

  useEffect(() => {
    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("drop-reply-created", ({ dropId }) => {
      fetchReplies(dropId);
      fetchDrops();
    });

    socketRef.current.on("drop-reply-reacted", ({ dropId, reply }) => {
      updateReplyInState(dropId, reply);
    });

    socketRef.current.on("drop-thread-reply-created", ({ dropId, reply }) => {
      updateReplyInState(dropId, reply);
    });

    socketRef.current.on("drop-thread-reply-deleted", ({ dropId, reply }) => {
      updateReplyInState(dropId, reply);
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
      setRepliesByDrop((prev) => ({ ...prev, [dropId]: res.data || [] }));
    } catch (err) {
      console.log("Replies error:", err.response?.data || err.message);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [dropId]: false }));
    }
  };

  const updateReplyInState = (dropId, updatedReply) => {
    setRepliesByDrop((prev) => ({
      ...prev,
      [dropId]: (prev[dropId] || []).map((reply) =>
        reply._id === updatedReply._id ? updatedReply : reply
      ),
    }));
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

  const openThread = async (dropId) => {
    if (!openDropIds.includes(dropId)) {
      setOpenDropIds((prev) => [...prev, dropId]);
      socketRef.current?.emit("join-drop", dropId);
    }

    await fetchReplies(dropId);
  };

  const toggleReplies = async (dropId) => {
    const isOpen = openDropIds.includes(dropId);

    if (isOpen) {
      setOpenDropIds((prev) => prev.filter((id) => id !== dropId));
      socketRef.current?.emit("leave-drop", dropId);
      return;
    }

    await openThread(dropId);
  };

  const openDropDetail = async (drop) => {
    setDetailDrop(drop);
    await openThread(drop._id);
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

      const dropId = selectedDrop._id;

      await API.post(`/api/posts/drops/${dropId}/reply`, {
        caption: replyText.trim(),
        isAnonymous,
      });

      closeReplyModal();

      if (!openDropIds.includes(dropId)) {
        setOpenDropIds((prev) => [...prev, dropId]);
        socketRef.current?.emit("join-drop", dropId);
      }

      await fetchReplies(dropId);
      await fetchDrops();
    } catch (err) {
      console.log("Reply error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Reply failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reactToReply = async (replyId, reactionType, dropId) => {
    const meta = reactions.find((r) => r.type === reactionType);

    try {
      setReactingId(`${replyId}-${reactionType}`);
      setReactionBurst({
        replyId,
        type: reactionType,
        icon: meta?.icon || "✨",
      });

      setTimeout(() => setReactionBurst(null), 750);

      const res = await API.post(`/api/posts/drops/reply/${replyId}/react`, {
        type: reactionType,
      });

      updateReplyInState(dropId, res.data);
    } catch (err) {
      console.log("Reaction error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Reaction failed");
    } finally {
      setReactingId(null);
    }
  };

  const openNestedComposer = (replyId) => {
    setNestedComposer(replyId);
    setNestedText("");
    setNestedAnonymous(false);
  };

  const closeNestedComposer = () => {
    setNestedComposer(null);
    setNestedText("");
    setNestedAnonymous(false);
  };

  const submitNestedReply = async (replyId, dropId) => {
    if (!nestedText.trim() || nestedSubmitting) return;

    try {
      setNestedSubmitting(true);

      const res = await API.post(`/api/posts/drops/reply/${replyId}/thread`, {
        text: nestedText.trim(),
        isAnonymous: nestedAnonymous,
      });

      updateReplyInState(dropId, res.data);

      setOpenThreads((prev) => ({
        ...prev,
        [replyId]: true,
      }));

      closeNestedComposer();
    } catch (err) {
      console.log("Nested reply error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Thread reply failed");
    } finally {
      setNestedSubmitting(false);
    }
  };

  const deleteNestedReply = async (replyId, threadReplyId, dropId) => {
    try {
      const res = await API.delete(
        `/api/posts/drops/reply/${replyId}/thread/${threadReplyId}`
      );

      updateReplyInState(dropId, res.data);
    } catch (err) {
      console.log("Delete nested error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const renderThreadReply = (threadReply, parentReply, dropId) => {
    const isAnon = threadReply.isAnonymous;
    const displayName = isAnon
      ? getAnonName(threadReply._id)
      : `@${threadReply.user?.username || "user"}`;

    const ownerId =
      typeof threadReply.user === "object"
        ? threadReply.user?._id || threadReply.user?.id
        : threadReply.user;

    const canDelete = ownerId?.toString() === userId?.toString();

    return (
      <div
        key={threadReply._id}
        className="relative ml-4 sm:ml-8 pl-4 border-l border-white/10"
      >
        <div className="bg-white/[0.035] border border-white/10 rounded-2xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center text-xs font-black shrink-0">
                {isAnon ? "?" : (threadReply.user?.username || "U")[0]?.toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{displayName}</p>
                <p className="text-[10px] text-gray-500">Thread reply</p>
              </div>
            </div>

            {canDelete && (
              <button
                onClick={() =>
                  deleteNestedReply(parentReply._id, threadReply._id, dropId)
                }
                className="text-xs text-gray-500 hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>

          <p className="text-sm text-gray-100 mt-2 leading-relaxed">
            {threadReply.text}
          </p>
        </div>
      </div>
    );
  };

  const renderNestedComposer = (reply, dropId) => {
    if (nestedComposer !== reply._id) return null;

    return (
      <div className="mt-3 ml-4 sm:ml-8 pl-4 border-l border-pink-500/30">
        <div className="bg-black/50 border border-white/10 rounded-2xl p-3">
          <textarea
            value={nestedText}
            onChange={(e) => setNestedText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitNestedReply(reply._id, dropId);
              }
            }}
            autoFocus
            maxLength={220}
            placeholder="Reply to this thought..."
            className="w-full h-20 bg-transparent outline-none resize-none text-sm text-white placeholder:text-gray-500"
          />

          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              onClick={() => setNestedAnonymous((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                nestedAnonymous
                  ? "bg-pink-500 border-pink-500 text-white"
                  : "bg-white/5 border-white/10 text-gray-300"
              }`}
            >
              {nestedAnonymous ? "Anonymous ON" : "Anonymous"}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={closeNestedComposer}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={() => submitNestedReply(reply._id, dropId)}
                disabled={nestedSubmitting || !nestedText.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-xs font-black disabled:opacity-50"
              >
                {nestedSubmitting ? "Posting..." : "Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReplyCard = (reply, dropId) => {
    const isAnon = reply.isAnonymous;
    const displayName = isAnon
      ? getAnonName(reply._id)
      : `@${reply.user?.username || "user"}`;

    const threadReplies = reply.threadReplies || [];
    const threadOpen = openThreads[reply._id];

    return (
      <div
        key={reply._id}
        className="bg-black/40 border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center font-black shrink-0">
            {isAnon ? "?" : (reply.user?.username || "U")[0]?.toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{displayName}</p>
            <p className="text-xs text-gray-500">
              {isAnon ? "Anonymous reply" : "Vybe reply"}
            </p>
          </div>
        </div>

        <p className="text-gray-100 leading-relaxed text-sm sm:text-base">
          {reply.caption}
        </p>

        <div className="flex gap-2 flex-wrap mt-4">
          {reactions.map((reaction) => {
            const count = getReactionCount(reply, reaction.type);
            const active = hasUserReacted(reply, reaction.type, userId);
            const loading = reactingId === `${reply._id}-${reaction.type}`;

            return (
              <button
                key={reaction.type}
                disabled={loading}
                onClick={() => reactToReply(reply._id, reaction.type, dropId)}
                className={`relative overflow-visible text-xs border rounded-full px-3 py-1.5 transition-all duration-300 disabled:opacity-60 ${
                  active
                    ? "bg-pink-500/20 border-pink-500/40 text-white scale-[1.03]"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                }`}
              >
                {reactionBurst?.replyId === reply._id &&
                  reactionBurst?.type === reaction.type && (
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl animate-vybe-pop">
                      {reactionBurst.icon}
                    </span>
                  )}

                <span className="relative z-10">
                  {reaction.icon} {reaction.label}
                  {count > 0 ? ` ${count}` : ""}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => openNestedComposer(reply._id)}
            className="text-xs border rounded-full px-3 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
          >
            Reply
          </button>

          {threadReplies.length > 0 && (
            <button
              onClick={() =>
                setOpenThreads((prev) => ({
                  ...prev,
                  [reply._id]: !prev[reply._id],
                }))
              }
              className="text-xs border rounded-full px-3 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
            >
              {threadOpen ? "Hide thread" : `Thread ${threadReplies.length}`}
            </button>
          )}
        </div>

        {renderNestedComposer(reply, dropId)}

        {threadOpen && threadReplies.length > 0 && (
          <div className="mt-3 space-y-3">
            {threadReplies.map((threadReply) =>
              renderThreadReply(threadReply, reply, dropId)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDropCard = (drop, featured = false) => {
    const tag = tagStyles[drop.vybeTag] || tagStyles.chill;
    const replies = repliesByDrop[drop._id] || [];
    const isOpen = openDropIds.includes(drop._id);
    const replyCount = Number(drop.replyCount || replies.length || 0);

    return (
      <div
        key={drop._id}
        className={`group bg-zinc-950/95 border border-white/10 ${
          featured
            ? "rounded-[30px] sm:rounded-[34px] p-5 sm:p-8"
            : "rounded-[26px] sm:rounded-[28px] p-4 sm:p-6"
        } shadow-xl hover:border-pink-500/60 transition-all relative overflow-hidden`}
      >
        <div
          className={`absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-r ${tag.gradient} opacity-20 blur-3xl rounded-full group-hover:opacity-35 transition`}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r ${tag.gradient} flex items-center justify-center font-black shadow-lg text-base sm:text-lg shrink-0`}
              >
                V
              </div>

              <div className="min-w-0">
                <h3 className="font-bold truncate text-sm sm:text-base">
                  @{drop.user?.username || "vybe"}
                </h3>
                <p className="text-xs text-gray-400">
                  {featured ? "Featured Drop" : "Official Vybe Drop"}
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r ${tag.gradient} font-bold shadow-lg whitespace-nowrap`}
            >
              {tag.icon} {tag.label}
            </span>
          </div>

          <button onClick={() => openDropDetail(drop)} className="text-left w-full">
            <p
              className={`${
                featured
                  ? "text-2xl sm:text-4xl"
                  : "text-[21px] sm:text-2xl"
              } font-black leading-[1.15] sm:leading-snug mb-5 sm:mb-6 text-white`}
            >
              {drop.caption}
            </p>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => openReplyModal(drop, false)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold hover:scale-[1.03] active:scale-95 transition-all shadow-lg text-sm sm:text-base"
            >
              Reply
            </button>

            <button
              onClick={() => openReplyModal(drop, true)}
              className="bg-white/5 border border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all text-sm sm:text-base"
            >
              Anonymous
            </button>

            <button
              onClick={() => toggleReplies(drop._id)}
              className="bg-white/5 border border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all text-sm sm:text-base"
            >
              {isOpen ? "Hide" : "Replies"} · {replyCount}
            </button>
          </div>

          {isOpen && (
            <div className="mt-5 sm:mt-6 border-t border-white/10 pt-4 sm:pt-5 space-y-3">
              {loadingReplies[drop._id] && !replies.length ? (
                <p className="text-gray-500 text-sm">Loading replies...</p>
              ) : replies.length ? (
                <>
                  {replies.slice(0, 3).map((reply) =>
                    renderReplyCard(reply, drop._id)
                  )}

                  {replies.length > 3 && (
                    <button
                      onClick={() => openDropDetail(drop)}
                      className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-3 font-semibold transition text-sm"
                    >
                      View all replies
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-400 text-sm">
                  No replies yet. Be the first one to share your vybe.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const detailReplies = detailDrop ? repliesByDrop[detailDrop._id] || [] : [];
  const detailTag = detailDrop
    ? tagStyles[detailDrop.vybeTag] || tagStyles.chill
    : tagStyles.chill;

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-5 md:px-8 pt-20 md:pt-8 pb-24">
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="bg-zinc-950/90 border border-white/10 rounded-[28px] sm:rounded-[34px] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-20 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

            <div className="relative">
              <p className="text-xs sm:text-sm text-pink-400 font-bold mb-2 tracking-wide">
                🔥 DAILY VYBE STARTERS
              </p>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                Vybe Drops
              </h1>

              <p className="text-gray-400 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
                Pick a prompt, share your thought, react to real replies, or go anonymous when the vybe feels personal.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky top-[76px] md:top-0 z-20 bg-black/80 backdrop-blur-xl -mx-3 px-3 sm:mx-0 sm:px-0 pt-2">
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
                      ? `bg-gradient-to-r ${tag.gradient} border-transparent text-white`
                      : "bg-white/5 border-white/10 text-gray-300"
                  }`}
                >
                  {tag.icon} {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-52 sm:h-56 bg-zinc-950 border border-white/10 rounded-[28px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {featuredDrop && activeTag === "all" && (
              <div className="mb-4 sm:mb-5">
                {renderDropCard(featuredDrop, true)}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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

      {detailDrop && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-3xl max-h-[92vh] bg-zinc-950 border border-white/10 rounded-t-[32px] sm:rounded-[34px] overflow-hidden shadow-2xl relative">
            <div
              className={`absolute -top-28 -right-28 w-72 h-72 bg-gradient-to-r ${detailTag.gradient} opacity-25 blur-3xl rounded-full`}
            />

            <div className="relative p-5 sm:p-7 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-pink-400 font-black mb-2">
                    LIVE DROP THREAD
                  </p>
                  <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                    {detailDrop.caption}
                  </h2>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full bg-gradient-to-r ${detailTag.gradient} font-bold`}
                    >
                      {detailTag.icon} {detailTag.label}
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                      {detailReplies.length || detailDrop.replyCount || 0} replies
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDetailDrop(null)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => openReplyModal(detailDrop, false)}
                  className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-3 rounded-2xl font-black active:scale-95 transition"
                >
                  Reply
                </button>
                <button
                  onClick={() => openReplyModal(detailDrop, true)}
                  className="flex-1 bg-white/5 border border-white/10 py-3 rounded-2xl font-bold active:scale-95 transition"
                >
                  Anonymous
                </button>
              </div>
            </div>

            <div className="relative p-4 sm:p-6 overflow-y-auto max-h-[58vh] space-y-3">
              {loadingReplies[detailDrop._id] && !detailReplies.length ? (
                <p className="text-gray-500 text-sm">Loading replies...</p>
              ) : detailReplies.length ? (
                detailReplies.map((reply) =>
                  renderReplyCard(reply, detailDrop._id)
                )
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-400">
                  No replies yet. Start this thread with your vybe.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
                  }
                }}
                placeholder="Write something real..."
                maxLength={280}
                autoFocus
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

      <style>
        {`
          @keyframes vybe-pop {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
            35% { opacity: 1; transform: translate(-50%, -95%) scale(1.35); }
            100% { opacity: 0; transform: translate(-50%, -150%) scale(0.75); }
          }

          .animate-vybe-pop {
            animation: vybe-pop 750ms ease-out forwards;
            filter: drop-shadow(0 0 14px rgba(236, 72, 153, 0.8));
          }
        `}
      </style>
    </div>
  );
}

export default VybeDrops;