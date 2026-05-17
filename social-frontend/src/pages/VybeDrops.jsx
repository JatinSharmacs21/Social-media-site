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

  const [typingByDrop, setTypingByDrop] = useState({});
  const [pulseByDrop, setPulseByDrop] = useState({});
  const typingTimeoutRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeMobileDrop, setActiveMobileDrop] = useState(0);

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

    socketRef.current.on("drop-reply-deleted", ({ dropId, replyId }) => {
  setRepliesByDrop((prev) => ({
    ...prev,
    [dropId]: (prev[dropId] || []).filter((reply) => reply._id !== replyId),
  }));

  fetchDrops();
});

    socketRef.current.on("drop-thread-reply-created", ({ dropId, reply }) => {
      updateReplyInState(dropId, reply);
    });

    socketRef.current.on("drop-thread-reply-deleted", ({ dropId, reply }) => {
      updateReplyInState(dropId, reply);
    });

    socketRef.current.on("drop-user-typing", ({ dropId, user }) => {
  setTypingByDrop((prev) => ({
    ...prev,
    [dropId]: user || "Someone",
  }));
});

socketRef.current.on("drop-user-stop-typing", ({ dropId }) => {
  setTypingByDrop((prev) => ({
    ...prev,
    [dropId]: null,
  }));
});

socketRef.current.on("drop-pulse-update", ({ dropId, count }) => {
  setPulseByDrop((prev) => ({
    ...prev,
    [dropId]: count,
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

  const mobileDrops = useMemo(() => {
    if (activeTag === "all" && featuredDrop) {
      return [featuredDrop, ...visibleDrops];
    }

    return visibleDrops;
  }, [activeTag, featuredDrop, visibleDrops]);

  const handleMobileScroll = (e) => {
  const container = e.currentTarget;
  const card = container.querySelector("[data-mobile-drop-card]");
  const cardWidth = card ? card.offsetWidth + 10 : container.clientWidth;
  const index = Math.round(container.scrollLeft / cardWidth);

  setActiveMobileDrop(Math.max(0, Math.min(index, mobileDrops.length - 1)));
};

const openThread = async (dropId) => {
  if (!openDropIds.includes(dropId)) {
    setOpenDropIds((prev) => [...prev, dropId]);
    socketRef.current?.emit("join-drop", dropId);

    setTimeout(() => {
      socketRef.current?.emit("drop-pulse", { dropId });
    }, 200);
  }

  await fetchReplies(dropId);
};

  const toggleReplies = async (dropId) => {
    const isOpen = openDropIds.includes(dropId);

    if (isOpen) {
      setOpenDropIds((prev) => prev.filter((id) => id !== dropId));
      socketRef.current?.emit("leave-drop", dropId);
      setTimeout(() => {
        socketRef.current?.emit("drop-pulse", { dropId });
        }, 200);
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
      socketRef.current?.emit("drop-typing-stop", {
    dropId,
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

const deleteDropReply = async () => {
  if (!deleteTarget || deleting) return;

  try {
    setDeleting(true);

    await API.delete(`/api/posts/drops/reply/${deleteTarget.replyId}`);

    setRepliesByDrop((prev) => ({
      ...prev,
      [deleteTarget.dropId]: (prev[deleteTarget.dropId] || []).filter(
        (reply) => reply._id !== deleteTarget.replyId
      ),
    }));

    setDeleteTarget(null);
    await fetchDrops();
  } catch (err) {
    console.log("Delete reply error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Delete failed");
  } finally {
    setDeleting(false);
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
      socketRef.current?.emit("drop-typing-stop", {
      dropId,
    });

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
        className="relative ml-7 sm:ml-10 pl-4 border-l border-white/15"
      >
        <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-3">
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
            onChange={(e) => {
  setNestedText(e.target.value);

}}
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

    const replyOwnerId =
  typeof reply.user === "object" ? reply.user?._id || reply.user?.id : reply.user;

const canDeleteReply =
  replyOwnerId?.toString() === userId?.toString() && !reply.isSeeded;

    return (
      <div
        key={reply._id}
        className="relative rounded-2xl border-l-2 border-pink-500/35 bg-white/[0.035] p-3 sm:p-4 shadow-inner"
      >
       <div className="flex items-start justify-between gap-2.5 mb-2">
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center text-xs font-black shrink-0">
      {isAnon ? "?" : (reply.user?.username || "U")[0]?.toUpperCase()}
    </div>

    <div className="min-w-0">
      <p className="font-bold text-sm truncate">{displayName}</p>
      <p className="text-xs text-gray-500">
        {isAnon ? "Anonymous reply" : "Vybe reply"}
      </p>
    </div>
  </div>

  {canDeleteReply && (
    <button
      onClick={() =>
  setDeleteTarget({
    replyId: reply._id,
    dropId,
  })
}
      className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-xs font-bold transition"
    >
      Delete
    </button>
  )}
</div>

        <p className="text-gray-100 leading-relaxed text-[13.5px] sm:text-sm pl-9">
          {reply.caption}
        </p>

        <div className="flex gap-1.5 flex-wrap mt-3 pl-9">
          {reactions.map((reaction) => {
            const count = getReactionCount(reply, reaction.type);
            const active = hasUserReacted(reply, reaction.type, userId);
            const loading = reactingId === `${reply._id}-${reaction.type}`;

            return (
              <button
                key={reaction.type}
                disabled={loading}
                onClick={() => reactToReply(reply._id, reaction.type, dropId)}
                className={`relative overflow-visible text-xs border rounded-full px-2.5 py-1.5 transition-all duration-300 disabled:opacity-60 ${
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
            className="text-xs border rounded-full px-2.5 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
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
              className="text-xs border rounded-full px-2.5 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
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
    const typingUser = typingByDrop[drop._id];
    const liveCount = pulseByDrop[drop._id] || 0;
    const isTrending = Number(drop.trendingScore || 0) >= 15;
    const isHotThread = Number(drop.threadReplyCount || 0) > 0;

    return (
      <div
        key={drop._id}
        className={`group bg-gradient-to-br from-zinc-950 via-[#0d0918] to-zinc-950 border border-white/10 ${
            featured
            ? "rounded-[30px] sm:rounded-[34px] p-5 sm:p-8"
            : "rounded-[24px] sm:rounded-[28px] p-4 sm:p-6"
        } shadow-xl hover:border-pink-500/60 transition-all relative overflow-hidden`}
      >
        <div
          className={`absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-r ${tag.gradient} opacity-20 blur-3xl rounded-full group-hover:opacity-35 transition`}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-2.5 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r ${tag.gradient} flex items-center justify-center font-black shadow-lg text-base sm:text-lg shrink-0`}
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

            <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[50%] sm:max-w-none">
  {isTrending && (
    <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-orange-500/15 border border-orange-400/20 text-orange-200 font-bold whitespace-nowrap">
      🔥 Trending
    </span>
  )}

  {isHotThread && (
    <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 font-bold whitespace-nowrap">
      💬 Active
    </span>
  )}

  <span
    className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r ${tag.gradient} font-bold shadow-lg whitespace-nowrap`}
  >
    {tag.icon} {tag.label}
  </span>
</div>
          </div>

          <button onClick={() => openDropDetail(drop)} className="text-left w-full">
            <p
              className={`${
                featured
                ? "text-[28px] sm:text-4xl"
                : "text-[22px] sm:text-2xl"
            } font-black leading-[1.14] sm:leading-snug mb-4 sm:mb-6 text-white line-clamp-3`}
            >
              {drop.caption}
            </p>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => openReplyModal(drop, false)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold hover:scale-[1.03] active:scale-95 transition-all shadow-lg text-xs sm:text-base"
            >
              Reply
            </button>

            <button
              onClick={() => openReplyModal(drop, true)}
              className="bg-white/5 border border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all text-xs sm:text-base"
            >
              Anonymous
            </button>

            <button
              onClick={() => toggleReplies(drop._id)}
              className="bg-white/5 border border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-gray-200 hover:bg-white/10 active:scale-95 transition-all text-xs sm:text-base"
            >
              {isOpen ? "Hide" : "Replies"} · {replyCount}
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-gray-400">
  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
    {replyCount} replies
  </span>

  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
    {Number(drop.reactionCount || 0)} reactions
  </span>

  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
    {Number(drop.threadReplyCount || 0)} threads
  </span>
</div>

          {isOpen && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            {liveCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-200">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 mr-2 animate-pulse" />
        {liveCount} live in this drop
      </span>
    )}

    {typingUser && (
      <span className="px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-400/20 text-pink-200">
        Someone is typing...
      </span>
    )}
  </div>
)}

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
    <div className="min-h-screen bg-black text-white px-3 sm:px-5 md:px-8 pt-0 sm:pt-2 md:pt-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-24 overflow-x-hidden">
      <div className="max-w-[1120px] mx-auto">
        <div className="mb-2 sm:mb-5">
          <div className="bg-zinc-950/90 border border-white/10 rounded-[22px] sm:rounded-[34px] p-4 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-20 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-[10px] sm:text-sm text-pink-400 font-bold mb-1.5 sm:mb-2 tracking-[0.16em]">
                  🔥 DAILY VYBE STARTERS
                </p>

                <h1 className="text-[30px] leading-none sm:text-4xl font-black tracking-tight">
                  Vybe Drops
                </h1>

                <p className="text-gray-400 mt-2 max-w-2xl text-[12.5px] sm:text-base leading-relaxed">
                  Pick a prompt, reply your way, or go anonymous when it feels personal.
                </p>
              </div>

              {/* <a
                href="/room"
                className="self-start sm:self-end inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3 py-2 text-xs sm:text-sm font-bold text-gray-200 hover:bg-white/10 hover:text-white transition"
              >
                Room <span className="text-pink-300">→</span>
              </a> */}
            </div>
          </div>
        </div>

        <div className="relative z-20 bg-black -mx-3 px-3 sm:mx-0 sm:px-0 pt-0">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-0">
            {Object.keys(tagStyles).map((tagKey) => {
              const tag = tagStyles[tagKey];

              return (
                <button
                  key={tagKey}
                  onClick={() => {
                    setActiveTag(tagKey);
                    setVisibleCount(6);
                    setActiveMobileDrop(0);
                  }}
                  className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-full border text-[13px] sm:text-sm font-bold transition ${
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
              <div className="hidden md:block mb-4 sm:mb-5">
                {renderDropCard(featuredDrop, true)}
            </div>
            )}

            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {visibleDrops.map((drop) => renderDropCard(drop))}
            </div>

            <div className="md:hidden">
  <div className="flex items-center justify-between mb-2 px-0.5">
    <p className="text-[10px] text-pink-400 font-black tracking-[0.18em]">
      SWIPE DROPS
    </p>

    <span className="text-xs text-gray-500">
      {mobileDrops.length ? activeMobileDrop + 1 : 0}/{mobileDrops.length}
    </span>
  </div>

  <div
  id="mobile-drops-carousel"
  onScroll={handleMobileScroll}
  className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-2 scrollbar-hide -mx-3 px-3"
>
    {mobileDrops.map((drop) => (
      <div
  key={drop._id}
  data-mobile-drop-card
  className="min-w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] snap-center"
>
        {renderDropCard(drop)}
      </div>
    ))}
  </div>

  {mobileDrops.length > 1 && (
    <div className="flex items-center justify-center gap-1.5 mt-0.5">
      {mobileDrops.map((drop, index) => (
        <button
          key={drop._id}
          onClick={() => {
            const container = document.getElementById("mobile-drops-carousel");
            if (container) {
              const card = container.querySelector("[data-mobile-drop-card]");
              const cardWidth = card ? card.offsetWidth + 10 : container.clientWidth;

            container.scrollTo({
            left: index * cardWidth,
            behavior: "smooth",
        });
            }
          }}
          className={`h-1.5 rounded-full transition-all ${
            activeMobileDrop === index
              ? "w-6 bg-pink-400"
              : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  )}
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
          <div className="w-full sm:max-w-3xl max-h-[94vh] bg-zinc-950 border border-white/10 rounded-t-[28px] sm:rounded-[34px] overflow-hidden shadow-2xl relative">
            <div
              className={`absolute -top-28 -right-28 w-72 h-72 bg-gradient-to-r ${detailTag.gradient} opacity-25 blur-3xl rounded-full`}
            />

            <div className="relative p-4 sm:p-7 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-pink-400 font-black mb-2">
                    LIVE DROP THREAD
                  </p>
                  <h2 className="text-xl sm:text-4xl font-black leading-tight">
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
                    {pulseByDrop[detailDrop._id] > 0 && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-200">
                        <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 mr-2 animate-pulse" />
                        {pulseByDrop[detailDrop._id]} live
                    </span>
                )}
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

            <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3">
                {typingByDrop[detailDrop._id] && (
                <div className="bg-pink-500/10 border border-pink-400/20 rounded-2xl p-3 text-sm text-pink-200">
                    Someone is typing...
                </div>
            )}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-t-[28px] sm:rounded-[30px] p-4 sm:p-6 relative overflow-hidden shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
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

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 mb-3">
                <p className="text-base sm:text-lg font-bold leading-snug">
                  {selectedDrop.caption}
                </p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => {
  setReplyText(e.target.value);

  if (selectedDrop?._id) {
    

    socketRef.current?.emit("drop-typing-start", {
      dropId: selectedDrop._id,
      user: isAnonymous ? "Anonymous" : "Someone",
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("drop-typing-stop", {
        dropId: selectedDrop._id,
      });
    }, 1200);
  }
}}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
                  }
                }}
                placeholder="Write something real..."
                maxLength={280}
                autoFocus
                className="w-full h-32 sm:h-36 bg-black/60 border border-white/10 rounded-2xl p-4 outline-none focus:border-pink-500 resize-none text-white placeholder:text-gray-500"
              />

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>
                  {isAnonymous
                    ? "Safe anonymous reply · Enter to post"
                    : "Profile reply · Enter to post"}
                </span>
                <span>{replyText.length}/280</span>
              </div>

              <div className="flex items-center justify-between mt-4 gap-2 sm:gap-3">
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl border font-semibold transition ${
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
                  className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-5 sm:px-6 py-3 rounded-2xl font-bold hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
  <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[28px] p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-red-500/20 blur-3xl rounded-full" />

      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mb-4">
          🗑️
        </div>

        <h3 className="text-xl font-black text-white">
          Delete this reply?
        </h3>

        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          This will remove your reply from this Vybe Drop. This action cannot be undone.
        </p>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-bold hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={deleteDropReply}
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-2xl bg-red-500/90 text-white font-black hover:bg-red-500 transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
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

  .line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
        `}
      </style>
    </div>
  );
}

export default VybeDrops;