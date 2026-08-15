import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import logger from "../utils/logger";
import Avatar from "../components/ui/Avatar";
import { BookmarkIcon } from "../components/feed/FeedIcons";
import { getMediaUrl, isImageMedia, formatVybeTime } from "../utils/mediaUtils";

function SavedPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsavingId, setUnsavingId] = useState(null);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const res = await API.get("/api/posts/saved/me");
        setPosts(res.data || []);
      } catch (error) {
        logger.error("Failed to load saved vybes:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  const handleUnsave = async (postId) => {
    setUnsavingId(postId);
    const prevPosts = posts;
    setPosts((prev) => prev.filter((post) => post._id !== postId));

    try {
      await API.put(`/api/posts/save/${postId}`);
    } catch (error) {
      logger.error("Failed to unsave post:", error.response?.data || error);
      setPosts(prevPosts);
    } finally {
      setUnsavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-2.5 sm:px-4 md:px-6 pt-0 sm:pt-3 md:pt-7 pb-28 md:pb-10">
      <div className="w-full max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 pt-3 pb-4 sm:pt-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg text-gray-300 transition hover:bg-white/[0.09] hover:text-white active:scale-95"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.22em] text-pink-300">YOUR COLLECTION</p>
            <h1 className="truncate text-xl font-black text-white">Saved Vybes</h1>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-[26px] border border-white/10 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-2xl">
              🔖
            </div>
            <p className="font-black text-gray-200">Nothing saved yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Tap the bookmark icon on any vybe to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const caption = post.caption || post.content;
              const firstMedia = post.media?.[0];
              const mediaUrl = firstMedia ? getMediaUrl(firstMedia) : "";
              const isImage = firstMedia ? isImageMedia(firstMedia) : false;

              return (
                <article
                  key={post._id}
                  className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between gap-3 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar src={post.user?.profilePic} name={post.user?.name || "User"} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{post.user?.name || "User"}</p>
                        <p className="text-[11px] font-semibold text-gray-500">{formatVybeTime(post.createdAt)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnsave(post._id)}
                      disabled={unsavingId === post._id}
                      className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-yellow-400 transition-all hover:bg-white/[0.07] active:scale-95 disabled:opacity-50"
                      title="Remove from saved"
                    >
                      <BookmarkIcon saved />
                    </button>
                  </div>

                  {caption && (
                    <p className="mt-2.5 px-3.5 text-sm leading-relaxed text-gray-200 sm:px-4">{caption}</p>
                  )}

                  {mediaUrl && (
                    <div className="mt-3 bg-black">
                      {isImage ? (
                        <img src={mediaUrl} alt="" className="max-h-[420px] w-full object-cover" />
                      ) : (
                        <video src={mediaUrl} controls playsInline className="max-h-[420px] w-full object-contain bg-black" />
                      )}
                    </div>
                  )}

                  <div className="h-3.5" />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedPosts;