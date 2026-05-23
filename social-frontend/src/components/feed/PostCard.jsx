import React from "react";
import {
  getMediaUrl,
  isImageMedia,
  getPostKind,
  getHeartAnimationSize,
  formatVybeTime,
} from "../../utils/mediaUtils";
import { getReplyKey } from "../../utils/postUtils";
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
} from "./FeedIcons";

function PostCard({
    post,
    currentUserId,
    openComments,
    savedPosts,
    heartPostId,
    heartCommentId,
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
    setOpenComments,
    commentText,
    setCommentText,
    addComment,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    addReply,
    deleteComment,
    deleteReply,
    handleCommentLikeWithAnimation,
    setSharePost,
}) {
              const isPostOwner = post.user?._id === currentUserId;
              const commentsOpen = openComments[post._id];
              const isSaved = savedPosts.includes(post._id);
              const postKind = getPostKind(post);
              const mediaList = post.media || [];
              const activeFeedMediaIndex = getFeedMediaIndex(post);
              const firstMedia = mediaList[activeFeedMediaIndex] || mediaList[0];
              const mediaCount = mediaList.length;

              return (
                <div
                  key={post._id}
                  className="relative bg-zinc-950/95 border border-white/10 rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-xl shadow-black/25 w-full hover:border-pink-500/20 hover:shadow-[0_0_36px_rgba(236,72,153,0.07)] transition-all duration-300 animate-vybe-card"
                >
                  {heartPostId === post._id && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                      <div
  className={`absolute rounded-full bg-pink-500/20 blur-3xl ${
    postKind === "Thought"
      ? "w-24 h-24"
      : postKind === "Moment"
      ? "w-40 h-40"
      : "w-36 h-36"
  }`}
/>
                      <div
                      className={`${getHeartAnimationSize(postKind)} animate-[heartPremium_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_24px_rgba(236,72,153,0.55)]`}
                      >
                        ❤️
                      </div>
                    </div>
                  )}

                  {/* HEADER */}
                  <div className="flex items-center justify-between p-3 sm:p-3.5 pb-2 relative">
                    <div
                      onClick={() => openUserProfile(post.user?._id)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                    >
                      <img
                        src={
                          post.user?.profilePic ||
                          "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                        }
                        alt=""
                        loading="lazy"
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white/10 shrink-0"
                      />

                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {post.user?.name || "Unknown User"}
                        </h4>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
  <p className="text-xs text-gray-500 truncate">
    {formatVybeTime(post.createdAt)}
  </p>
</div>
                      </div>
                    </div>

                    {isPostOwner && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === post._id ? null : post._id
                            )
                          }
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-base text-gray-400 transition hover:bg-white/[0.07] hover:text-white active:scale-95"
                        >
                          ⋮
                        </button>

                        {openMenuId === post._id && (
                          <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                            <button
                              onClick={() => startEditPost(post)}
                              className="block w-full px-4 py-3 text-left text-sm font-bold text-gray-200 transition hover:bg-white/[0.07] hover:text-white"
                            >
                              Edit vybe
                            </button>

                            <button
                              onClick={() => requestDeletePost(post)}
                              className="block w-full px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                            >
                              Delete vybe
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CAPTION / EDIT */}
                  {editingPostId === post._id ? (
                    <div className="px-4 pb-4">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 outline-none focus:border-pink-500 text-white"
                        rows="3"
                      />

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => saveEditPost(post._id)}
                          className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-sm"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEditPost}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    (post.caption || post.content) && (
                      <p
  onDoubleClick={() =>
    handlePostLikeWithAnimation(post._id)
  }
  className={`mx-3.5 sm:mx-5 mb-3 sm:mb-4 mt-0.5 max-w-[94%] break-words whitespace-pre-wrap cursor-pointer select-none transition-all ${
    postKind === "Thought"
      ? "rounded-[20px] border border-pink-400/10 bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-cyan-500/[0.04] px-4 py-4 text-[17px] sm:text-[19px] leading-[1.55] font-semibold tracking-[-0.01em] text-gray-100"
      : "text-[14px] sm:text-[15px] leading-6 text-gray-100"
  }`}
>
                        {post.caption || post.content}
                      </p>
                    )
                  )}

                  {/* MEDIA */}
                  {firstMedia && (
                    <div className="mx-2.5 sm:mx-3 mb-2 sm:mb-3">
                      <div
                        onDoubleClick={() => handlePostLikeWithAnimation(post._id)}
                        onTouchStart={handleFeedMediaTouchStart}
                        onTouchMove={handleFeedMediaTouchMove}
                        onTouchEnd={() => handleFeedMediaTouchEnd(post._id, mediaCount)}
                        className="group relative rounded-[20px] sm:rounded-[24px] w-full aspect-[4/5] max-h-[520px] sm:max-h-[620px] bg-black flex items-center justify-center select-none overflow-hidden border border-white/10 shadow-xl shadow-black/30"
                      >
                        {isImageMedia(firstMedia) ? (
                          <>
                            {!loadedMedia[getMediaUrl(firstMedia)] && (
                              <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-pink-500/[0.08] animate-pulse" />
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
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.018] ${loadedMedia[getMediaUrl(firstMedia)] ? "opacity-100" : "opacity-0"}`}
                          />
                          </>
                        ) : (
                          <video
                            src={getMediaUrl(firstMedia)}
                            muted
                            playsInline
                            className="w-full h-full object-contain bg-black"
                          />
                        )}

                        <div className="hidden absolute inset-0 items-center justify-center bg-zinc-950 text-center px-6">
                          <div>
                            <p className="text-3xl mb-2">🖼️</p>
                            <p className="text-sm text-gray-400">
                              Media could not be loaded
                            </p>
                          </div>
                        </div>

                        {mediaCount > 1 && (
                          <>
                            <div className="absolute right-3 top-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
                              {activeFeedMediaIndex + 1} / {mediaCount}
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl px-3 py-2">
                              {mediaList.slice(0, 6).map((_, dotIndex) => (
                                <span
                                  key={dotIndex}
                                  className={`h-1.5 rounded-full transition-all ${
                                    dotIndex === activeFeedMediaIndex ? "w-5 bg-pink-400" : "w-1.5 bg-white/55"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/85 to-transparent p-4">
                          <p className="text-xs font-bold text-white/90">
                            {mediaCount > 1 ? `${mediaCount} moments stacked` : "Double tap to feel"}
                          </p>
                        </div>
                      </div>

                      {mediaCount > 1 && (
                        <div className="mt-2 flex items-center justify-between gap-2 px-1">
                          <p className="text-[12px] font-black text-pink-300">{mediaCount} moments stacked</p>
                          <div className="hidden sm:flex items-center gap-1.5">
                            <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "prev")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 hover:bg-white/[0.08] active:scale-95 transition">‹</button>
                            <button type="button" onClick={() => slideFeedMedia(post._id, mediaCount, "next")} className="h-7 w-7 rounded-full border border-white/10 bg-white/[0.035] text-sm text-white/85 hover:bg-white/[0.08] active:scale-95 transition">›</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-3 sm:pb-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handlePostLikeWithAnimation(post._id)}
                          className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 sm:px-3 py-1.5 active:scale-95 hover:bg-white/[0.07] transition-all ${
                            isPostLikedByMe(post)
                              ? "text-pink-400"
                              : "text-gray-100 hover:text-pink-400"
                          }`}
                          title="Felt"
                        >
                          <HeartIcon filled={isPostLikedByMe(post)} />
                          <span
  onClick={(e) => {
    e.stopPropagation();
    setLikesModalPost(post);
  }}
  className="text-[11px] sm:text-[12px] font-bold hover:underline cursor-pointer"
>
  {post.likes?.length || 0} Felt
</span>
                        </button>

                        <button
                          onClick={() => setCommentsSheetPost(post)}
                          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2.5 sm:px-3 py-1.5 text-gray-200 hover:text-indigo-300 hover:bg-white/[0.07] active:scale-95 transition-all"
                          title="Replies"
                        >
                          <CommentIcon />
                          <span className="text-[11px] sm:text-[12px] font-bold">
                            {post.comments?.length || 0} Replies
                          </span>
                        </button>

                        <button
                          onClick={() => setSharePost(post)}
                          className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-gray-200 hover:text-cyan-300 hover:bg-white/[0.07] active:scale-95 transition-all"
                          title="Share"
                        >
                          <ShareIcon />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleSavePost(post._id)}
                        className={`rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 active:scale-95 hover:bg-white/[0.07] transition-all ${
                          isSaved
                            ? "text-yellow-400"
                            : "text-gray-100 hover:text-yellow-300"
                        }`}
                        title={isSaved ? "Saved" : "Save"}
                      >
                        <BookmarkIcon saved={isSaved} />
                      </button>
                    </div>

                    {isSaved && (
                      <p className="mb-3 text-xs text-yellow-400">
                        Saved to your Vybe collection
                      </p>
                    )}

                    {/* COMMENTS PANEL */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        commentsOpen
                          ? "max-h-[760px] opacity-100 mt-4 border-t border-white/10 pt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Replies</h3>

                        <button
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post._id]: false,
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Hide
                        </button>
                      </div>

                      {/* COMMENT INPUT */}
                      <div className="sticky top-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5 bg-zinc-950/95 backdrop-blur-xl pb-3">
                        <input
                          type="text"
                          value={commentText[post._id] || ""}
                          onChange={(e) =>
                            setCommentText((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addComment(post._id);
                            }
                          }}
                          placeholder="Drop a reply..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 text-sm"
                        />

                        <button
                          onClick={() => addComment(post._id)}
                          className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500 text-sm transition-all sm:w-auto w-full"
                        >
                          Reply
                        </button>
                      </div>

                      {/* COMMENTS */}
                      {post.comments && post.comments.length > 0 ? (
                        <div className="space-y-4 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                          {post.comments.map((comment) => {
                            const isCommentOwner =
                              comment.user?._id === currentUserId;

                            const canDeleteComment =
                              isCommentOwner || isPostOwner;

                            const replyKey = getReplyKey(post._id, comment._id);
                            const isReplying = replyingTo[replyKey];

                            return (
                              <div
                                key={comment._id}
                                className="bg-white/[0.04] border border-white/5 rounded-2xl p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <img
                                    onClick={() =>
                                      openUserProfile(comment.user?._id)
                                    }
                                    src={
                                      comment.user?.profilePic ||
                                      "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                                    }
                                    alt=""
                                    loading="lazy"
                                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-all"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p
                                        onClick={() =>
                                          openUserProfile(comment.user?._id)
                                        }
                                        className="font-semibold text-white text-sm truncate cursor-pointer hover:text-pink-400 transition-all"
                                      >
                                        {comment.user?.name || "User"}
                                      </p>

                                      {canDeleteComment && (
                                        <button
                                          onClick={() =>
                                            deleteComment(
                                              post._id,
                                              comment._id
                                            )
                                          }
                                          className="text-red-400 hover:text-red-300 text-xs shrink-0"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>

                                    <p className="text-gray-300 text-sm mt-1 break-words">
                                      {comment.text}
                                    </p>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                      <button
                                        onClick={() =>
                                          handleCommentLikeWithAnimation(
                                            post._id,
                                            comment._id
                                          )
                                        }
                                        className="relative flex items-center gap-1 hover:text-pink-400"
                                        title="Like comment"
                                      >
                                        {heartCommentId === comment._id && (
                                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-[heartPremium_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards] pointer-events-none">
                                            ❤️
                                          </span>
                                        )}

                                        <HeartIcon />
                                        {comment.likes?.length || 0}
                                      </button>

                                      <button
                                        onClick={() =>
                                          setReplyingTo((prev) => ({
                                            ...prev,
                                            [replyKey]: !prev[replyKey],
                                          }))
                                        }
                                        className="hover:text-indigo-400"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {/* REPLIES */}
                                    {comment.replies &&
                                      comment.replies.length > 0 && (
                                        <div className="mt-3 ml-2 border-l border-white/10 pl-3 space-y-3">
                                          {comment.replies.map((reply) => {
                                            const isReplyOwner =
                                              reply.user?._id ===
                                              currentUserId;

                                            const canDeleteReply =
                                              isReplyOwner || isPostOwner;

                                            return (
                                              <div
                                                key={reply._id}
                                                className="flex items-start gap-2"
                                              >
                                                <img
                                                  onClick={() =>
                                                    openUserProfile(
                                                      reply.user?._id
                                                    )
                                                  }
                                                  src={
                                                    reply.user?.profilePic ||
                                                    "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                                                  }
                                                  alt=""
                                                  loading="lazy"
                                                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-all"
                                                />

                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm break-words">
                                                      <span
                                                        onClick={() =>
                                                          openUserProfile(
                                                            reply.user?._id
                                                          )
                                                        }
                                                        className="font-semibold text-white mr-2 cursor-pointer hover:text-pink-400 transition-all"
                                                      >
                                                        {reply.user?.name ||
                                                          "User"}
                                                      </span>

                                                      <span className="text-gray-300">
                                                        {reply.text}
                                                      </span>
                                                    </p>

                                                    {canDeleteReply && (
                                                      <button
                                                        onClick={() =>
                                                          deleteReply(
                                                            post._id,
                                                            comment._id,
                                                            reply._id
                                                          )
                                                        }
                                                        className="text-red-400 text-xs ml-2 shrink-0"
                                                      >
                                                        Delete
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    {/* REPLY INPUT */}
                                    {isReplying && (
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
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
                                              addReply(post._id, comment._id);
                                            }
                                          }}
                                          placeholder="Write a reply..."
                                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                                        />

                                        <button
                                          onClick={() =>
                                            addReply(post._id, comment._id)
                                          }
                                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-indigo-500 text-xs sm:w-auto w-full"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-6">
                          No replies yet. Be the first to feel this ✨
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
}

export default PostCard;
