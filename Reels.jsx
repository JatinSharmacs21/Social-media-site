import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { SOCKET_URL } from "../config/env";
import logger from "../utils/logger";

function Reels() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [heartReelId, setHeartReelId] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [savingComment, setSavingComment] = useState({});
  const [savingReply, setSavingReply] = useState({});
  const [shareReel, setShareReel] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingClip, setEditingClip] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [progressByReel, setProgressByReel] = useState({});
  const [pausedReels, setPausedReels] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});

  const videoRefs = useRef({});
  const tapTimerRef = useRef(null);
  const holdTimerRef = useRef(null);
  const likeLocksRef = useRef({});

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null") || {};
    } catch {
      return {};
    }
  })();

  const currentUserLite = {
    _id: currentUserId,
    name: currentUser.name || localStorage.getItem("userName") || "You",
    username: currentUser.username || localStorage.getItem("username") || "",
    profilePic: currentUser.profilePic || "",
  };

  const getMediaUrl = (item) => {
    let rawUrl = "";

    if (typeof item === "string") {
      rawUrl = item;
    } else {
      rawUrl =
        item?.url ||
        item?.secure_url ||
        item?.mediaUrl ||
        item?.fileUrl ||
        item?.path ||
        item?.filePath ||
        item?.src ||
        "";
    }

    if (!rawUrl) return "";

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }

    const baseUrl = API.defaults?.baseURL || "";
    return `${baseUrl}${rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl}`;
  };

  const isVideoMedia = (item) => {
    const type = (
      item?.type ||
      item?.resource_type ||
      item?.mimetype ||
      ""
    ).toLowerCase();

    const url = getMediaUrl(item).toLowerCase();

    return (
      type.includes("video") ||
      url.includes("/video/") ||
      url.includes("video/upload") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm") ||
      url.endsWith(".mkv")
    );
  };

  const buildClipItems = (posts = []) => {
    const videoPosts = [];

    posts.forEach((post) => {
      const videos =
        post.media?.filter((item) => isVideoMedia(item) && getMediaUrl(item)) ||
        [];

      videos.forEach((video, index) => {
        videoPosts.push({
          ...post,
          reelId: `${post._id}-${index}`,
          videoUrl: getMediaUrl(video),
          videoIndex: index,
        });
      });
    });

    return videoPosts;
  };

  const updateReelPostInState = (updatedPost) => {
    if (!updatedPost?._id) return;

    setClips((prev) =>
      prev.map((reel) =>
        reel._id === updatedPost._id
          ? {
              ...reel,
              ...updatedPost,
              reelId: reel.reelId,
              videoUrl: reel.videoUrl,
              videoIndex: reel.videoIndex,
            }
          : reel
      )
    );

    setShareReel((current) =>
      current?._id === updatedPost._id ? { ...current, ...updatedPost } : current
    );
  };

  useEffect(() => {
    const fetchClips = async () => {
      try {
        setLoading(true);
        const res = await API.get("/api/posts?page=1&limit=80");
        const videoPosts = buildClipItems(res.data.posts || []);

        setClips(videoPosts);

        if (videoPosts.length > 0) {
          setActiveReelId(videoPosts[0].reelId);
        }
      } catch (error) {
        logger.error(error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socket.on("connect", () => {
      socket.emit("register-user");
    });

    socket.on("post-updated", (updatedPost) => {
      updateReelPostInState(updatedPost);
    });

    socket.on("post-deleted", ({ postId }) => {
      setClips((prev) => prev.filter((reel) => reel._id !== postId));
      setShareReel((current) => (current?._id === postId ? null : current));
    });

    return () => {
      socket.off("post-updated");
      socket.off("post-deleted");
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const reelId = entry.target.getAttribute("data-reel-id");
          const video = videoRefs.current[reelId];

          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            setActiveReelId(reelId);
            if (!pausedReels[reelId]) {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0.2, 0.65, 0.9],
      }
    );

    const cards = document.querySelectorAll(".reel-snap-card");
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, [clips, pausedReels]);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) video.muted = muted;
    });
  }, [muted]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const isReelLikedByMe = (reel) => {
    return reel.likes?.some((like) => {
      if (typeof like === "string") return like === currentUserId;
      return like?._id === currentUserId;
    });
  };

  const isCommentLikedByMe = (comment) => {
    return comment.likes?.some((like) => {
      if (typeof like === "string") return like === currentUserId;
      return like?._id === currentUserId;
    });
  };

  const getCommentCount = (reel) => {
    const comments = reel.comments || [];
    return comments.reduce(
      (total, comment) => total + 1 + (comment.replies?.length || 0),
      0
    );
  };

  const formatCount = (value = 0) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value;
  };

  const getReplyPreview = (comment) => {
    const replies = comment.replies || [];
    const key = comment._id;
    return expandedReplies[key] ? replies : replies.slice(0, 2);
  };

  const scrollToNextClip = (reelId) => {
    const index = clips.findIndex((clip) => clip.reelId === reelId);
    const nextClip = clips[index + 1];

    if (!nextClip) {
      const currentVideo = videoRefs.current[reelId];
      if (currentVideo) {
        currentVideo.currentTime = 0;
        currentVideo.play().catch(() => {});
      }
      return;
    }

    document
      .querySelector(`[data-reel-id="${nextClip.reelId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProgress = (reelId, event) => {
    const video = event.currentTarget;
    if (!video.duration) return;

    setProgressByReel((prev) => ({
      ...prev,
      [reelId]: Math.min((video.currentTime / video.duration) * 100, 100),
    }));
  };

  const togglePlayPause = (reelId) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    if (video.paused) {
      setPausedReels((prev) => ({ ...prev, [reelId]: false }));
      video.play().catch(() => {});
    } else {
      setPausedReels((prev) => ({ ...prev, [reelId]: true }));
      video.pause();
    }
  };

  const isClipOwner = (clip) => clip?.user?._id === currentUserId;

  const startEditClip = (clip) => {
    setEditingClip(clip);
    setEditCaption(clip.caption || clip.content || "");
    setOpenMenuId(null);
  };

  const saveEditClip = async () => {
    try {
      if (!editingClip?._id) return;

      setSavingEdit(true);

      const res = await API.put(
        `/api/posts/${editingClip._id}`,
        {
          caption: editCaption.trim(),
        },
        authConfig
      );

      updateReelPostInState(res.data);
      setEditingClip(null);
      setEditCaption("");
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteClip = async (clip) => {
    try {
      if (!clip?._id) return;

      const confirmDelete = window.confirm("Delete this clip?");
      if (!confirmDelete) return;

      await API.delete(`/api/posts/${clip._id}`, authConfig);

      setClips((prev) => prev.filter((reel) => reel._id !== clip._id));
      setOpenMenuId(null);
    } catch (error) {
      logger.error(error.response?.data || error);
    }
  };

  const likeReel = async (postId, reelId) => {
    if (likeLocksRef.current[postId]) return;

    const currentReel = clips.find((clip) => clip._id === postId);
    if (!currentReel) return;

    const alreadyLiked = isReelLikedByMe(currentReel);
    const optimisticLikes = alreadyLiked
      ? (currentReel.likes || []).filter((like) => {
          const likeId = typeof like === "string" ? like : like?._id;
          return likeId !== currentUserId;
        })
      : [...(currentReel.likes || []), currentUserLite];

    likeLocksRef.current[postId] = true;

    updateReelPostInState({
      ...currentReel,
      likes: optimisticLikes,
    });

    if (!alreadyLiked) {
      setHeartReelId(reelId);
      setTimeout(() => setHeartReelId(null), 850);
    }

    try {
      const res = await API.put(`/api/posts/like/${postId}`, {}, authConfig);
      updateReelPostInState(res.data);
    } catch (error) {
      updateReelPostInState(currentReel);
      logger.error(error.response?.data || error);
    } finally {
      likeLocksRef.current[postId] = false;
    }
  };

  const handleVideoTap = (reel) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      likeReel(reel._id, reel.reelId);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      setMuted((prev) => !prev);
      tapTimerRef.current = null;
    }, 230);
  };

  const handleHoldStart = (reel) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      togglePlayPause(reel.reelId);
      holdTimerRef.current = null;
    }, 430);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const addComment = async (postId) => {
    try {
      const text = commentText[postId];
      if (!text || !text.trim() || savingComment[postId]) return;

      setSavingComment((prev) => ({ ...prev, [postId]: true }));

      const res = await API.post(
        `/api/posts/comment/${postId}`,
        { text: text.trim() },
        authConfig
      );

      updateReelPostInState(res.data);
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      setOpenComments((prev) => ({ ...prev, [postId]: true }));
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setSavingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const addReply = async (postId, commentId) => {
    const key = `${postId}-${commentId}`;
    const text = replyText[key];

    if (!text || !text.trim() || savingReply[key]) return;

    try {
      setSavingReply((prev) => ({ ...prev, [key]: true }));

      const res = await API.post(
        `/api/posts/comment/reply/${postId}/${commentId}`,
        { text: text.trim() },
        authConfig
      );

      updateReelPostInState(res.data);
      setReplyText((prev) => ({ ...prev, [key]: "" }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
    } catch (error) {
      logger.error(error.response?.data || error);
    } finally {
      setSavingReply((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/${postId}/${commentId}`,
        authConfig
      );
      updateReelPostInState(res.data);
    } catch (error) {
      logger.error(error.response?.data || error);
    }
  };

  const deleteReply = async (postId, commentId, replyId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/reply/${postId}/${commentId}/${replyId}`,
        authConfig
      );
      updateReelPostInState(res.data);
    } catch (error) {
      logger.error(error.response?.data || error);
    }
  };

  const likeComment = async (postId, commentId) => {
    try {
      const res = await API.put(
        `/api/posts/comment/like/${postId}/${commentId}`,
        {},
        authConfig
      );
      updateReelPostInState(res.data);
    } catch (error) {
      logger.error(error.response?.data || error);
    }
  };

  const canRemoveComment = (reel, comment) => {
    return comment.user?._id === currentUserId || reel.user?._id === currentUserId;
  };

  const canRemoveReply = (reel, reply) => {
    return reply.user?._id === currentUserId || reel.user?._id === currentUserId;
  };

  const openUserProfile = (userId) => {
    if (!userId) return;
    navigate(userId === currentUserId ? "/profile" : `/profile/${userId}`);
  };

  const openTunedIn = (postId) => {
    if (!postId) return;
    navigate(`/feed?post=${postId}&openComments=1`);
  };

  const getShareUrl = (postId) => `${window.location.origin}/post/${postId}`;

  const copyShareLink = async () => {
    if (!shareReel?._id) return;

    try {
      await navigator.clipboard.writeText(getShareUrl(shareReel._id));
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 1500);
    } catch (error) {
      logger.error("Copy failed:", error);
    }
  };

  const nativeShare = async () => {
    if (!shareReel?._id) return;

    const data = {
      title: "Clip",
      text: shareReel.caption || shareReel.content || "Clip",
      url: getShareUrl(shareReel._id),
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await copyShareLink();
      }
    } catch (error) {
      logger.error("Share cancelled:", error);
    }
  };

  const avatarFor = (user, fallback = "User") =>
    user?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || fallback
    )}&background=8b5cf6&color=fff`;

  const HeartIcon = ({ filled = true }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8.5L3 22V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );

  const ShareIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );

  const VolumeIcon = ({ off = false }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {off ? (
        <>
          <path d="M19 9l-6 6" />
          <path d="M13 9l6 6" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );

  const TunedIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13.5 9.5 19 20 6" />
      <path d="M4 6h7" />
      <path d="M4 10h4" />
    </svg>
  );

  if (loading) {
    return (
      <div className="fixed inset-x-0 top-[72px] bottom-[68px] md:top-0 md:bottom-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading clips</p>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="fixed inset-x-0 top-[72px] bottom-[68px] md:top-0 md:bottom-0 bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No clips yet</h2>
          <p className="text-gray-400">
            Clips you share will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-[72px] bottom-[68px] md:top-0 md:bottom-0 bg-black text-white overflow-hidden">
      <div className="h-full w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {clips.map((reel) => {
          const isActive = activeReelId === reel.reelId;
          const isLiked = isReelLikedByMe(reel);
          const commentsOpen = openComments[reel._id];

          return (
            <section
              key={reel.reelId}
              data-reel-id={reel.reelId}
              className="reel-snap-card relative h-full w-full max-w-full snap-start flex items-center justify-center bg-black overflow-hidden"
            >
              <div className="relative h-full w-full max-w-full sm:h-[94svh] sm:max-w-[430px] md:max-w-[460px] sm:rounded-[2rem] overflow-hidden bg-zinc-950 shadow-2xl shadow-black/60 border-x border-white/10">
                <button
                  type="button"
                  onClick={() => handleVideoTap(reel)}
                  onMouseDown={() => handleHoldStart(reel)}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={() => handleHoldStart(reel)}
                  onTouchEnd={handleHoldEnd}
                  className="absolute inset-0 z-10 cursor-pointer text-left"
                  aria-label="Tap to mute or unmute. Double tap to feel. Long press to pause or play."
                />

                <video
                  ref={(el) => {
                    videoRefs.current[reel.reelId] = el;
                  }}
                  src={reel.videoUrl}
                  playsInline
                  muted={muted}
                  preload={isActive ? "auto" : "metadata"}
                  onTimeUpdate={(event) => handleProgress(reel.reelId, event)}
                  onEnded={() => scrollToNextClip(reel.reelId)}
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/45 pointer-events-none" />

                <div className="absolute left-4 right-4 top-[64px] sm:top-[74px] z-30 pointer-events-none">
                  <div className="h-1 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/10 shadow-[0_0_22px_rgba(0,0,0,0.55)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-300 shadow-[0_0_16px_rgba(236,72,153,0.65)] transition-[width] duration-100"
                      style={{ width: `${progressByReel[reel.reelId] || 0}%` }}
                    />
                  </div>
                </div>

                {pausedReels[reel.reelId] && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="rounded-full border border-white/15 bg-black/45 backdrop-blur-md px-5 py-3 text-sm font-bold text-white shadow-2xl">
                      Paused
                    </div>
                  </div>
                )}

                {heartReelId === reel.reelId && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-44 h-44 bg-pink-500/20 blur-3xl rounded-full" />
                    <div className="text-[105px] sm:text-[130px] animate-[heartPremium_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.6)]">
                      ❤️
                    </div>
                  </div>
                )}

                <div className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-4 pt-3 sm:pt-5 pb-3 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/45 border border-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-lg"
                    title="Back"
                  >
                    ←
                  </button>

                  <div className="pointer-events-auto rounded-full border border-white/10 bg-black/35 px-4 py-2 text-center shadow-xl backdrop-blur-md">
                    <h2 className="text-sm sm:text-base font-black tracking-[0.18em] uppercase text-white/95">
                      Clips
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                    {isClipOwner(reel) && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === reel.reelId ? null : reel.reelId
                            )
                          }
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/45 border border-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-lg"
                          title="Clip options"
                        >
                          ⋮
                        </button>

                        {openMenuId === reel.reelId && (
                          <div className="absolute right-0 top-12 w-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
                            <button
                              onClick={() => startEditClip(reel)}
                              className="block w-full px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10"
                            >
                              Edit clip
                            </button>
                            <button
                              onClick={() => deleteClip(reel)}
                              className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10"
                            >
                              Delete clip
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setMuted((prev) => !prev)}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/45 border border-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                      title={muted ? "Unmute" : "Mute"}
                    >
                      <VolumeIcon off={muted} />
                    </button>
                  </div>
                </div>

                <div className="absolute right-3 sm:right-4 bottom-28 sm:bottom-32 z-20 flex flex-col items-center gap-3">
                  <div className="rounded-[1.6rem] border border-white/10 bg-black/[0.32] p-2 shadow-2xl backdrop-blur-xl">
                    <button
                      onClick={() => likeReel(reel._id, reel.reelId)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all ${
                        isLiked
                          ? "bg-pink-500/20 text-pink-300 shadow-[0_0_22px_rgba(236,72,153,0.28)]"
                          : "bg-white/[0.08] text-white hover:bg-white/12 hover:text-pink-200"
                      }`}
                      title="Felt"
                    >
                      <HeartIcon filled={isLiked} />
                    </button>
                    <p className="mt-1 text-center text-[11px] font-black text-white/90">
                      {formatCount(reel.likes?.length || 0)}
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-black/[0.32] p-2 shadow-2xl backdrop-blur-xl">
                    <button
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [reel._id]: !prev[reel._id],
                        }))
                      }
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/[0.08] text-white flex items-center justify-center hover:bg-indigo-500/18 hover:text-indigo-100 active:scale-90 transition-all"
                      title="Replies"
                    >
                      <CommentIcon />
                    </button>
                    <p className="mt-1 text-center text-[11px] font-black text-white/90">
                      {formatCount(getCommentCount(reel))}
                    </p>
                  </div>

                  <button
                    onClick={() => setShareReel(reel)}
                    className="w-12 h-12 rounded-2xl border border-white/10 bg-black/[0.32] text-white shadow-2xl backdrop-blur-xl flex items-center justify-center hover:bg-white/12 hover:text-cyan-200 active:scale-90 transition-all"
                    title="Share"
                  >
                    <ShareIcon />
                  </button>
                </div>

                <div className="absolute left-0 right-16 sm:right-20 bottom-0 z-20 p-3 sm:p-4 pb-6 pointer-events-none">
                  <div className="pointer-events-auto rounded-[1.7rem] border border-white/10 bg-black/30 p-3 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => openUserProfile(reel.user?._id)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      >
                        <img
                          src={avatarFor(reel.user)}
                          alt=""
                          className="h-10 w-10 rounded-2xl object-cover border border-white/20"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-black leading-tight text-white">
                            {reel.user?.name || "Unknown User"}
                          </p>
                          <p className="truncate text-xs text-white/60">
                            {reel.user?.username ? `@${reel.user.username}` : "Creator"}
                          </p>
                        </div>
                      </div>

                      {!isClipOwner(reel) && reel.user?._id && (
                        <button
                          type="button"
                          onClick={() => openUserProfile(reel.user?._id)}
                          className="shrink-0 rounded-full border border-pink-300/25 bg-gradient-to-r from-pink-500/25 to-purple-500/25 px-3 py-2 text-xs font-black text-pink-50 shadow-[0_0_22px_rgba(236,72,153,0.18)] hover:from-pink-500/35 hover:to-purple-500/35 active:scale-95"
                        >
                          Tune In
                        </button>
                      )}
                    </div>

                    {(reel.caption || reel.content) && (
                      <p className="mt-3 text-sm sm:text-[15px] text-white/90 leading-5 sm:leading-6 line-clamp-3">
                        {reel.caption || reel.content}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`absolute left-2 right-2 bottom-2 z-40 overflow-hidden rounded-[2rem] border border-pink-300/12 bg-[#080812]/92 shadow-[0_-24px_80px_rgba(0,0,0,0.72)] backdrop-blur-2xl transition-all duration-300 ${
                    commentsOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-[110%] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/70 to-transparent" />
                  <div className="max-h-[76svh] overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-200/80">
                          Clip discussion
                        </p>
                        <h3 className="mt-1 text-xl font-black text-white">
                          Replies
                          <span className="ml-2 rounded-full border border-white/10 bg-white/[0.08] px-2 py-0.5 text-xs text-white/75">
                            {formatCount(getCommentCount(reel))}
                          </span>
                        </h3>
                      </div>

                      <button
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [reel._id]: false,
                          }))
                        }
                        className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.08] text-white/70 hover:bg-white/12 hover:text-white active:scale-95 text-xl"
                        title="Close replies"
                      >
                        ×
                      </button>
                    </div>

                    <div className="sticky top-0 z-10 mb-4 rounded-3xl border border-white/10 bg-black/30 p-2 shadow-xl backdrop-blur-xl">
                      <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[reel._id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [reel._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addComment(reel._id);
                        }}
                        placeholder="Add a reply"
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-pink-400/50 focus:bg-white/[0.09]"
                      />

                      <button
                        onClick={() => addComment(reel._id)}
                        disabled={savingComment[reel._id]}
                        className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/15 transition-all hover:scale-[1.02] disabled:opacity-50"
                      >
                        {savingComment[reel._id] ? "..." : "Reply"}
                      </button>
                      </div>
                    </div>

                    {reel.comments && reel.comments.length > 0 ? (
                      <div className="space-y-3">
                        {reel.comments.map((comment) => {
                          const replyKey = `${reel._id}-${comment._id}`;
                          const replyBoxOpen = replyingTo[reel._id] === comment._id;
                          const commentLiked = isCommentLikedByMe(comment);

                          return (
                            <div
                              key={comment._id}
                              className="rounded-3xl border border-white/[0.08] bg-white/[0.055] p-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  onClick={() => openUserProfile(comment.user?._id)}
                                  src={avatarFor(comment.user)}
                                  alt=""
                                  className="w-9 h-9 rounded-2xl object-cover cursor-pointer border border-white/10"
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-bold text-white">
                                        {comment.user?.name || "User"}
                                      </p>
                                      <p className="text-sm leading-5 text-white/75 break-words">
                                        {comment.text}
                                      </p>
                                    </div>

                                    {canRemoveComment(reel, comment) && (
                                      <button
                                        onClick={() =>
                                          deleteComment(reel._id, comment._id)
                                        }
                                        className="text-[11px] text-red-300/80 hover:text-red-200"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>

                                  <div className="mt-2 flex items-center gap-4 text-xs text-white/45">
                                    <button
                                      onClick={() => likeComment(reel._id, comment._id)}
                                      className={`font-semibold ${
                                        commentLiked
                                          ? "text-pink-300"
                                          : "hover:text-pink-200"
                                      }`}
                                    >
                                      Felt {comment.likes?.length ? comment.likes.length : ""}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setReplyingTo((prev) => ({
                                          ...prev,
                                          [reel._id]: replyBoxOpen ? null : comment._id,
                                        }))
                                      }
                                      className="font-semibold hover:text-indigo-200"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {comment.replies?.length > 0 && (
                                <div className="ml-11 mt-3 space-y-2 border-l border-white/10 pl-3">
                                  {getReplyPreview(comment).map((reply) => (
                                    <div
                                      key={reply._id}
                                      className="flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-black/28 p-2.5"
                                    >
                                      <img
                                        onClick={() => openUserProfile(reply.user?._id)}
                                        src={avatarFor(reply.user)}
                                        alt=""
                                        className="w-7 h-7 rounded-xl object-cover cursor-pointer border border-white/10"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <p className="text-xs font-bold text-gray-100">
                                              {reply.user?.name || "User"}
                                            </p>
                                            <p className="text-sm leading-5 text-white/75 break-words">
                                              {reply.text}
                                            </p>
                                          </div>
                                          {canRemoveReply(reel, reply) && (
                                            <button
                                              onClick={() =>
                                                deleteReply(
                                                  reel._id,
                                                  comment._id,
                                                  reply._id
                                                )
                                              }
                                              className="text-[11px] text-red-300/80 hover:text-red-200"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {comment.replies.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedReplies((prev) => ({
                                          ...prev,
                                          [comment._id]: !prev[comment._id],
                                        }))
                                      }
                                      className="text-xs font-bold text-indigo-200 hover:text-white"
                                    >
                                      {expandedReplies[comment._id]
                                        ? "Show fewer replies"
                                        : `View ${comment.replies.length - 2} more replies`}
                                    </button>
                                  )}
                                </div>
                              )}

                              {replyBoxOpen && (
                                <div className="ml-11 mt-3 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText[replyKey] || ""}
                                    onChange={(e) =>
                                      setReplyText((prev) => ({
                                        ...prev,
                                        [replyKey]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        addReply(reel._id, comment._id);
                                      }
                                    }}
                                    placeholder={`Reply to ${
                                      comment.user?.name || "user"
                                    }...`}
                                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm outline-none focus:border-pink-400/40"
                                  />
                                  <button
                                    onClick={() => addReply(reel._id, comment._id)}
                                    disabled={savingReply[replyKey]}
                                    className="rounded-xl bg-pink-500/20 px-3 py-2 text-xs font-bold text-pink-100 hover:bg-pink-500 disabled:opacity-50"
                                  >
                                    {savingReply[replyKey] ? "..." : "Send"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.045] px-4 py-10 text-center">
                        <p className="text-sm font-bold text-white/80">No replies yet</p>
                        <p className="mt-1 text-xs text-white/40">Be the first to respond to this clip.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {editingClip && (
        <div
          onClick={() => {
            if (!savingEdit) {
              setEditingClip(null);
              setEditCaption("");
            }
          }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-pink-300 font-black">
                  EDIT
                </p>
                <h3 className="text-xl font-black mt-1">Edit caption</h3>
              </div>

              <button
                onClick={() => {
                  if (!savingEdit) {
                    setEditingClip(null);
                    setEditCaption("");
                  }
                }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows="4"
              placeholder="Add a caption"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-pink-400/50"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={saveEditClip}
                disabled={savingEdit}
                className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 px-4 py-3 font-bold text-white disabled:opacity-60 active:scale-[0.98]"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  if (!savingEdit) {
                    setEditingClip(null);
                    setEditCaption("");
                  }
                }}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/15"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {shareReel && (
        <div
          onClick={() => setShareReel(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Share clip</h3>

              <button
                onClick={() => setShareReel(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
              <p className="text-sm text-gray-300 line-clamp-2">
                {shareReel.caption || shareReel.content || "Clip"}
              </p>
              <p className="text-xs text-gray-500 mt-2 truncate">
                {getShareUrl(shareReel._id)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={copyShareLink}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-all font-medium"
              >
                {copiedShare ? "Copied ✅" : "Copy link"}
              </button>

              <button
                onClick={nativeShare}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-[1.02] transition-all font-medium"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reels;
