import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Reels() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [heartReelId, setHeartReelId] = useState(null);
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [shareReel, setShareReel] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const videoRefs = useRef({});

  const authConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  useEffect(() => {
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

    const fetchReels = async () => {
      try {
        setLoading(true);
        const res = await API.get("/api/posts");

        const videoPosts = [];

        res.data.forEach((post) => {
          const videos =
            post.media?.filter(
              (item) => isVideoMedia(item) && getMediaUrl(item)
            ) || [];

          videos.forEach((video, index) => {
            videoPosts.push({
              ...post,
              reelId: `${post._id}-${index}`,
              videoUrl: getMediaUrl(video),
            });
          });
        });

        setReels(videoPosts);

        if (videoPosts.length > 0) {
          setActiveReelId(videoPosts[0].reelId);
        }
      } catch (error) {
        console.log(error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const reelId = entry.target.getAttribute("data-reel-id");
          const video = videoRefs.current[reelId];

          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            setActiveReelId(reelId);
            video.play().catch(() => {});
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
  }, [reels]);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) video.muted = muted;
    });
  }, [muted]);

  const isReelLikedByMe = (reel) => {
    return reel.likes?.some((like) => {
      if (typeof like === "string") return like === currentUserId;
      return like?._id === currentUserId;
    });
  };

  const updateReelPostInState = (updatedPost) => {
    setReels((prev) =>
      prev.map((reel) =>
        reel._id === updatedPost._id
          ? {
              ...reel,
              ...updatedPost,
            }
          : reel
      )
    );
  };

  const likeReel = async (postId, reelId) => {
    try {
      const res = await API.put(`/api/posts/like/${postId}`, {}, authConfig);
      updateReelPostInState(res.data);
      setHeartReelId(reelId);

      setTimeout(() => {
        setHeartReelId(null);
      }, 850);
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const addComment = async (postId) => {
    try {
      const text = commentText[postId];

      if (!text || !text.trim()) return;

      const res = await API.post(
        `/api/posts/comment/${postId}`,
        {
          text: text.trim(),
        },
        authConfig
      );

      updateReelPostInState(res.data);

      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));

      setOpenComments((prev) => ({
        ...prev,
        [postId]: true,
      }));
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };

  const openUserProfile = (userId) => {
    if (!userId) return;
    navigate(userId === currentUserId ? "/profile" : `/profile/${userId}`);
  };

  const getShareUrl = (postId) => `${window.location.origin}/post/${postId}`;

  const copyShareLink = async () => {
    if (!shareReel?._id) return;

    try {
      await navigator.clipboard.writeText(getShareUrl(shareReel._id));
      setCopiedShare(true);

      setTimeout(() => {
        setCopiedShare(false);
      }, 1500);
    } catch (error) {
      console.log("Copy failed:", error);
    }
  };

  const nativeShare = async () => {
    if (!shareReel?._id) return;

    const data = {
      title: "Check this reel",
      text: shareReel.caption || shareReel.content || "Vybeo reel",
      url: getShareUrl(shareReel._id),
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await copyShareLink();
      }
    } catch (error) {
      console.log("Share cancelled:", error);
    }
  };

  const HeartIcon = ({ filled = true }) => (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );

  const ShareIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 sm:pt-6 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 sm:pt-6 pb-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
          <p className="text-gray-400">
            Upload a video post from Feed and it will automatically appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <div className="h-full overflow-y-scroll snap-y snap-mandatory">
        {reels.map((reel) => {
          const isActive = activeReelId === reel.reelId;
          const isLiked = isReelLikedByMe(reel);
          const commentsOpen = openComments[reel._id];

          return (
            <section
              key={reel.reelId}
              data-reel-id={reel.reelId}
              className="reel-snap-card relative h-screen w-full snap-start flex items-center justify-center bg-black"
            >
              <div className="relative h-full w-full sm:h-[92vh] sm:max-w-[430px] md:max-w-[460px] sm:rounded-[2rem] overflow-hidden bg-zinc-950 shadow-2xl border-x border-white/10">
                <video
                  ref={(el) => {
                    videoRefs.current[reel.reelId] = el;
                  }}
                  src={reel.videoUrl}
                  loop
                  playsInline
                  muted={muted}
                  preload="metadata"
                  onDoubleClick={() => likeReel(reel._id, reel.reelId)}
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/35 pointer-events-none" />

                {heartReelId === reel.reelId && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-44 h-44 bg-pink-500/20 blur-3xl rounded-full" />
                    <div className="text-[105px] sm:text-[130px] animate-[heartPremium_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.6)]">
                      ❤️
                    </div>
                  </div>
                )}

                <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Reels
                    </h2>
                    {isActive && (
                      <p className="text-xs text-pink-200/80">Watching now</p>
                    )}
                  </div>

                  <button
                    onClick={() => setMuted((prev) => !prev)}
                    className="w-11 h-11 rounded-full bg-black/40 border border-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                    title={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? "🔇" : "🔊"}
                  </button>
                </div>

                <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
                  <button
                    onClick={() => likeReel(reel._id, reel.reelId)}
                    className={`w-12 h-12 rounded-full border backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
                      isLiked
                        ? "bg-pink-500/20 border-pink-400/40 text-pink-400"
                        : "bg-black/35 border-white/15 text-white hover:text-pink-300"
                    }`}
                  >
                    <HeartIcon filled={isLiked} />
                  </button>
                  <span className="-mt-4 text-xs font-semibold">
                    {reel.likes?.length || 0}
                  </span>

                  <button
                    onClick={() =>
                      setOpenComments((prev) => ({
                        ...prev,
                        [reel._id]: !prev[reel._id],
                      }))
                    }
                    className="w-12 h-12 rounded-full bg-black/35 border border-white/15 backdrop-blur-md flex items-center justify-center hover:text-indigo-300 active:scale-90 transition-all"
                  >
                    <CommentIcon />
                  </button>
                  <span className="-mt-4 text-xs font-semibold">
                    {reel.comments?.length || 0}
                  </span>

                  <button
                    onClick={() => setShareReel(reel)}
                    className="w-12 h-12 rounded-full bg-black/35 border border-white/15 backdrop-blur-md flex items-center justify-center hover:text-cyan-300 active:scale-90 transition-all"
                  >
                    <ShareIcon />
                  </button>
                </div>

                <div className="absolute left-0 right-16 bottom-0 z-20 p-4 pb-8">
                  <div
                    onClick={() => openUserProfile(reel.user?._id)}
                    className="inline-flex items-center gap-3 cursor-pointer mb-3"
                  >
                    <img
                      src={
                        reel.user?.profilePic ||
                        "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />

                    <div>
                      <p className="font-bold leading-tight">
                        {reel.user?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-300">Original reel</p>
                    </div>
                  </div>

                  {(reel.caption || reel.content) && (
                    <p className="text-sm sm:text-[15px] text-gray-100 leading-6 line-clamp-3">
                      {reel.caption || reel.content}
                    </p>
                  )}
                </div>

                <div
                  className={`absolute left-0 right-0 bottom-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl transition-all duration-300 ${
                    commentsOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-full opacity-0"
                  }`}
                >
                  <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">
                        Comments ({reel.comments?.length || 0})
                      </h3>

                      <button
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [reel._id]: false,
                          }))
                        }
                        className="text-gray-400 hover:text-white text-xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex gap-2 mb-4">
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
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 text-sm"
                      />

                      <button
                        onClick={() => addComment(reel._id)}
                        className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500 text-sm transition-all"
                      >
                        Send
                      </button>
                    </div>

                    {reel.comments && reel.comments.length > 0 ? (
                      <div className="space-y-3">
                        {reel.comments.map((comment) => (
                          <div
                            key={comment._id}
                            className="flex items-start gap-3 bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                          >
                            <img
                              onClick={() =>
                                openUserProfile(comment.user?._id)
                              }
                              src={
                                comment.user?.profilePic ||
                                "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                              }
                              alt=""
                              className="w-8 h-8 rounded-full object-cover cursor-pointer"
                            />

                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {comment.user?.name || "User"}
                              </p>
                              <p className="text-sm text-gray-300 break-words">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

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
              <h3 className="text-lg font-bold">Share reel</h3>

              <button
                onClick={() => setShareReel(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
              <p className="text-sm text-gray-300 line-clamp-2">
                {shareReel.caption || shareReel.content || "Vybeo reel"}
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
                Share now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reels;
