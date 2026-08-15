import React from "react";
import Avatar from "../ui/Avatar";
import {
  getMediaUrl,
  isImageMedia,
  getPostKind,
  getHeartAnimationSize,
  formatVybeTime,
} from "../../utils/mediaUtils";
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from "./FeedIcons";

function PostCard({
  post,
  currentUserId,
  savedPosts,
  heartPostId,
  loadedMedia,
  editingPostId,
  editCaption,
  setEditCaption,
  openMenuId,
  setOpenMenuId,
  getFeedMediaIndex,
  openUserProfile,
  startEditPost,
  requestDeletePost,
  saveEditPost,
  cancelEditPost,
  handlePostLikeWithAnimation,
  handleFeedMediaTouchStart,
  handleFeedMediaTouchMove,
  handleFeedMediaTouchEnd,
  markMediaLoaded,
  slideFeedMedia,
  isPostLikedByMe,
  setLikesModalPost,
  setCommentsSheetPost,
  toggleSavePost,
  setSharePost,
}) {
  const isPostOwner = post.user?._id === currentUserId;
  const isSaved = savedPosts.includes(post._id);

  const [showSavedToast, setShowSavedToast] = React.useState(false);
  const prevSavedRef = React.useRef(isSaved);

  React.useEffect(() => {
    if (isSaved && !prevSavedRef.current) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 1800);
      prevSavedRef.current = isSaved;
      return () => clearTimeout(timer);
    }
    prevSavedRef.current = isSaved;
  }, [isSaved]);

  const postKind = getPostKind(post);
  const mediaList = post.media || [];
  const activeFeedMediaIndex = getFeedMediaIndex(post);
  const firstMedia = mediaList[activeFeedMediaIndex] || mediaList[0];
  const mediaCount = mediaList.length;
  const caption = post.caption || post.content;
  const likedByMe = isPostLikedByMe(post);

  return (
    <article className="group/card relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/95 shadow-xl shadow-black/25 transition-all duration-300 animate-vybe-card hover:border-pink-500/25 hover:shadow-[0_0_38px_rgba(236,72,153,0.08)] sm:rounded-[30px]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-pink-500/[0.055] blur-3xl opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

      {heartPostId === post._id && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div
            className={`absolute rounded-full bg-pink-500/20 blur-3xl ${
              postKind === "Thought" ? "h-24 w-24" : postKind === "Moment" ? "h-40 w-40" : "h-36 w-36"
            }`}
          />
          <div className={`${getHeartAnimationSize(postKind)} animate-[heartPremium_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.55)]`}>
            ❤️
          </div>
        </div>
      )}

      <header className="relative flex items-center justify-between gap-3 px-3.5 pb-2 pt-3.5 sm:px-4 sm:pt-4">
        <button
          type="button"
          onClick={() => openUserProfile(post.user?._id)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Avatar src={post.user?.profilePic} name={post.user?.name || "User"} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <h4 className="truncate text-[14px] font-black text-white sm:text-[15px]">
              {post.user?.name || "Unknown User"}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="truncate text-[11px] font-bold text-gray-500">{formatVybeTime(post.createdAt)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[10px] font-black text-gray-400">
                {postKind}
              </span>
            </div>
          </div>
        </button>

        {isPostOwner && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenuId(openMenuId === post._id ? null : post._id)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-base text-gray-400 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
              aria-label="Post options"
            >
              ⋮
            </button>

            {openMenuId === post._id && (
              <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={() => startEditPost(post)}
                  className="block w-full px-4 py-3 text-left text-sm font-bold text-gray-200 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Edit vybe
                </button>
                <button
                  type="button"
                  onClick={() => requestDeletePost(post)}
                  className="block w-full px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                >
                  Delete vybe
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {editingPostId === post._id ? (
        <div className="px-3.5 pb-4 sm:px-4">
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none transition focus:border-pink-500"
            rows="3"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => saveEditPost(post._id)} className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-black text-white transition hover:bg-pink-600 active:scale-95">
              Save
            </button>
            <button type="button" onClick={cancelEditPost} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20 active:scale-95">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        caption && (
          <p
            onDoubleClick={() => handlePostLikeWithAnimation(post._id)}
            className={`mx-3.5 mb-3 mt-1 max-w-[calc(100%-28px)] cursor-pointer select-none whitespace-pre-wrap break-words transition-all sm:mx-4 sm:max-w-[calc(100%-32px)] ${
              postKind === "Thought"
                ? "rounded-[22px] border border-pink-400/10 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-cyan-500/[0.045] px-4 py-4 text-[17px] font-semibold leading-[1.55] tracking-[-0.01em] text-gray-100 sm:text-[19px]"
                : "text-[14px] leading-6 text-gray-100 sm:text-[15px]"
            }`}
          >
            {caption}
          </p>
        )
      )}

      {firstMedia && (
        <div className="mx-2.5 mb-2.5 sm:mx-3 sm:mb-3">
          <div
            onDoubleClick={() => handlePostLikeWithAnimation(post._id)}
            onTouchStart={handleFeedMediaTouchStart}
            onTouchMove={handleFeedMediaTouchMove}
            onTouchEnd={() => handleFeedMediaTouchEnd(post._id, mediaCount)}
            className="group/media relative flex aspect-[4/5] max-h-[620px] w-full select-none items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-xl shadow-black/30 sm:rounded-[26px]"
          >
            {isImageMedia(firstMedia) ? (
              <>
                {!loadedMedia[getMediaUrl(firstMedia)] && (
                  <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-pink-500/[0.08]" />
                )}
                <img
                  src={getMediaUrl(firstMedia)}
                  alt=""
                  loading="lazy"
                  onLoad={() => markMediaLoaded(firstMedia)}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = "flex";
                  }}
                  className={`h-full w-full object-cover transition-all duration-500 group-hover/media:scale-[1.018] ${
                    loadedMedia[getMediaUrl(firstMedia)] ? "opacity-100" : "opacity-0"
                  }`}
                />
              </>
            ) : (
              <video src={getMediaUrl(firstMedia)} muted playsInline controls className="h-full w-full bg-black object-contain" />
            )}

            <div className="absolute inset-0 hidden items-center justify-center bg-zinc-950 px-6 text-center">
              <div>
                <p className="mb-2 text-3xl">🖼️</p>
                <p className="text-sm text-gray-400">Media could not be loaded</p>
              </div>
            </div>

            {mediaCount > 1 && (
              <>
                <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-black text-white shadow-lg backdrop-blur-xl">
                  {activeFeedMediaIndex + 1} / {mediaCount}
                </div>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-xl">
                  {mediaList.slice(0, 6).map((_, dotIndex) => (
                    <span key={dotIndex} className={`h-1.5 rounded-full transition-all ${dotIndex === activeFeedMediaIndex ? "w-5 bg-pink-400" : "w-1.5 bg-white/55"}`} />
                  ))}
                </div>
              </>
            )}

            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 to-transparent p-4 transition-transform duration-300 group-hover/media:translate-y-0">
              <p className="text-xs font-bold text-white/90">{mediaCount > 1 ? `${mediaCount} moments stacked` : "Double tap to feel"}</p>
            </div>
          </div>

          {mediaCount > 1 && (
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <p className="text-[12px] font-black text-pink-300">{mediaCount} moments stacked</p>
              <div className="hidden items-center gap-1.5 sm:flex">
                <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "prev")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 transition hover:bg-white/[0.08] active:scale-95">‹</button>
                <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "next")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 transition hover:bg-white/[0.08] active:scale-95">›</button>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="border-t border-white/5 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handlePostLikeWithAnimation(post._id)}
              className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition-all hover:bg-white/[0.07] active:scale-95 sm:px-3 ${
                likedByMe ? "text-pink-400" : "text-gray-100 hover:text-pink-400"
              }`}
              title="Felt"
            >
              <HeartIcon filled={likedByMe} />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setLikesModalPost(post);
                }}
                className="text-[11px] font-bold hover:underline sm:text-[12px]"
              >
                {post.likes?.length || 0} Felt
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCommentsSheetPost(post)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-200 transition-all hover:bg-white/[0.07] hover:text-indigo-300 active:scale-95 sm:px-3"
              title="Replies"
            >
              <CommentIcon />
              <span className="text-[11px] font-bold sm:text-[12px]">{post.comments?.length || 0} Replies</span>
            </button>

            <button
              type="button"
              onClick={() => setSharePost(post)}
              className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-200 transition-all hover:bg-white/[0.07] hover:text-cyan-300 active:scale-95"
              title="Share"
            >
              <ShareIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleSavePost(post._id)}
            className={`rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.07] active:scale-90 ${
              isSaved ? "text-yellow-400 scale-105" : "text-gray-100 hover:text-yellow-300"
            }`}
            title={isSaved ? "Saved" : "Save"}
          >
            <BookmarkIcon saved={isSaved} />
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showSavedToast ? "mt-2 max-h-14 opacity-100" : "mt-0 max-h-0 opacity-0"
          }`}
        >
          <p className="flex items-center gap-1.5 rounded-2xl border border-yellow-300/15 bg-yellow-400/10 px-3 py-2 text-[11px] font-bold text-yellow-300">
            <span>✓</span> Saved to your Vybe collection
          </p>
        </div>
      </footer>
    </article>
  );
}

export default PostCard;