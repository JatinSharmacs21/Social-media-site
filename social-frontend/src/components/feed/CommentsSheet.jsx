import React, { useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import { getReplyKey } from "../../utils/postUtils";
import { HeartIcon } from "./FeedIcons";

function CommentsSheet({
  activeCommentsPost,
  setCommentsSheetPost,
  currentUserId,
  openUserProfile,
  deleteComment,
  addComment,
  commentText,
  setCommentText,
  replyingTo = {},
  setReplyingTo,
  replyText = {},
  setReplyText,
  addReply,
  deleteReply,
  handleCommentLikeWithAnimation,
  heartCommentId,
}) {
  const dragState = useRef({ startY: 0, dragging: false });
  const [dragY, setDragY] = useState(0);

  if (!activeCommentsPost) return null;

  const comments = activeCommentsPost.comments || [];
  const postOwnerId = activeCommentsPost.user?._id;

  const handleDragStart = (e) => {
    dragState.current.startY = e.touches[0].clientY;
    dragState.current.dragging = true;
  };

  const handleDragMove = (e) => {
    if (!dragState.current.dragging) return;
    const delta = e.touches[0].clientY - dragState.current.startY;
    if (delta > 0) setDragY(delta);
  };

  const handleDragEnd = () => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (dragY > 90) {
      setCommentsSheetPost(null);
    }
    setDragY(0);
  };

  return (
    <div onClick={() => setCommentsSheetPost(null)} className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[86dvh] overflow-hidden rounded-t-[30px] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/70 animate-vybe-sheet sm:max-w-xl sm:rounded-[32px]"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? "transform 0.25s ease" : "none",
        }}
      >
        <header
          className="relative overflow-hidden border-b border-white/10 bg-zinc-950/95 p-3.5 backdrop-blur-2xl sm:p-4"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pink-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <div
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onTouchCancel={handleDragEnd}
            className="relative -mt-2 mb-1 flex h-8 w-full cursor-grab items-center justify-center sm:hidden"
            style={{ touchAction: "none" }}
          >
            <span className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.22em] text-pink-300">VYBE REPLIES</p>
              <h3 className="mt-0.5 truncate text-lg font-black text-white">{comments.length} replies</h3>
              {(activeCommentsPost.caption || activeCommentsPost.content) && (
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">{activeCommentsPost.caption || activeCommentsPost.content}</p>
              )}
            </div>
            <button type="button" onClick={() => setCommentsSheetPost(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-xl text-gray-300 transition hover:bg-white/[0.09] hover:text-white active:scale-95">
              ×
            </button>
          </div>
        </header>

        <div className="max-h-[54dvh] overflow-y-auto px-3.5 py-3 no-scrollbar sm:max-h-[56vh] sm:px-4 sm:py-4">
          {comments.length > 0 ? (
            <div className="space-y-2.5">
              {comments.map((comment) => {
                const replyKey = getReplyKey(activeCommentsPost._id, comment._id);
                const isReplying = Boolean(replyingTo[replyKey]);
                const canDeleteComment = comment.user?._id === currentUserId || postOwnerId === currentUserId;

                return (
                  <div key={comment._id} className={`rounded-[22px] border p-3.5 transition-all ${comment.isTemp ? "border-pink-300/25 bg-pink-500/[0.07] opacity-85" : "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"}`}>
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => openUserProfile(comment.user?._id)} className="shrink-0">
                        <Avatar src={comment.user?.profilePic} name={comment.user?.name || "User"} size="sm" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <button type="button" onClick={() => openUserProfile(comment.user?._id)} className="truncate text-left text-sm font-black text-white hover:text-pink-300">
                            {comment.user?.name || "User"}
                          </button>
                          {canDeleteComment && !comment.isTemp && (
                            <button type="button" onClick={() => deleteComment(activeCommentsPost._id, comment._id)} className="shrink-0 rounded-full border border-red-400/15 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-200 transition hover:bg-red-500/18">
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 break-words text-sm leading-relaxed text-gray-300">{comment.text}</p>
                        {comment.isTemp ? (
                          <p className="mt-1 text-[10px] font-bold text-pink-200/70">Sending...</p>
                        ) : (
                          <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-400">
                            <button type="button" onClick={() => handleCommentLikeWithAnimation?.(activeCommentsPost._id, comment._id)} className="relative flex items-center gap-1 transition hover:text-pink-400">
                              {heartCommentId === comment._id && <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-[heartPremium_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards]">❤️</span>}
                              <HeartIcon /> {comment.likes?.length || 0}
                            </button>
                            <button type="button" onClick={() => setReplyingTo?.((prev) => ({ ...prev, [replyKey]: !prev[replyKey] }))} className="transition hover:text-indigo-300">
                              Reply
                            </button>
                          </div>
                        )}

                        {comment.replies?.length > 0 && (
                          <div className="mt-3 space-y-3 border-l border-white/10 pl-3">
                            {comment.replies.map((reply) => {
                              const canDeleteReply = reply.user?._id === currentUserId || postOwnerId === currentUserId;
                              return (
                                <div key={reply._id} className="flex items-start gap-2">
                                  <button type="button" onClick={() => openUserProfile(reply.user?._id)} className="shrink-0">
                                    <Avatar src={reply.user?.profilePic} name={reply.user?.name || "User"} size="xs" />
                                  </button>
                                  <div className="min-w-0 flex-1 rounded-2xl bg-black/20 px-3 py-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="min-w-0 break-words text-sm text-gray-300">
                                        <button type="button" onClick={() => openUserProfile(reply.user?._id)} className="mr-2 font-black text-white hover:text-pink-300">
                                          {reply.user?.name || "User"}
                                        </button>
                                        {reply.text}
                                      </p>
                                      {canDeleteReply && (
                                        <button type="button" onClick={() => deleteReply?.(activeCommentsPost._id, comment._id, reply._id)} className="shrink-0 text-[10px] font-black text-red-300 hover:text-red-200">
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

                        {isReplying && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={replyText[replyKey] || ""}
                              onChange={(e) => setReplyText?.((prev) => ({ ...prev, [replyKey]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addReply?.(activeCommentsPost._id, comment._id);
                              }}
                              placeholder="Write a reply..."
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
                            />
                            <button type="button" onClick={() => addReply?.(activeCommentsPost._id, comment._id)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-indigo-500 active:scale-95">
                              Send
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
            <div className="py-12 text-center text-gray-500">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-2xl">💬</div>
              <p className="font-black text-gray-200">No replies yet</p>
              <p className="mt-1 text-sm">Be the first one to join this vybe.</p>
            </div>
          )}
        </div>

        <footer className="border-t border-white/10 bg-zinc-950/95 p-3 sm:p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText[activeCommentsPost._id] || ""}
              onChange={(e) => setCommentText((prev) => ({ ...prev, [activeCommentsPost._id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment(activeCommentsPost._id);
              }}
              placeholder="Drop a clean reply..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm outline-none transition focus:border-pink-400/45 focus:bg-white/[0.07]"
            />
            <button type="button" onClick={() => addComment(activeCommentsPost._id)} className="rounded-2xl bg-gradient-to-r from-pink-500/85 via-purple-500/85 to-cyan-500/85 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/15 transition active:scale-95">
              Reply
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default CommentsSheet;