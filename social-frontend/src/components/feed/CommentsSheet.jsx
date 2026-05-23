import React from "react";

function CommentsSheet({
  activeCommentsPost,
  setCommentsSheetPost,
  currentUserId,
  openUserProfile,
  deleteComment,
  addComment,
  commentText,
  setCommentText,
}) {
  if (!activeCommentsPost) return null;

  return (
        <div
          onClick={() => setCommentsSheetPost(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl max-h-[82dvh] overflow-hidden rounded-t-[28px] sm:rounded-[30px] border border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/70 animate-vybe-sheet"
          >
            <div className="relative overflow-hidden border-b border-white/10 bg-zinc-950/95 p-3.5 sm:p-4 backdrop-blur-2xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pink-500/14 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.22em] text-pink-300 font-black">VYBE REPLIES</p>
                  <h3 className="mt-0.5 truncate text-lg font-black text-white">
                    {activeCommentsPost.comments?.length || 0} replies
                  </h3>
                  {(activeCommentsPost.caption || activeCommentsPost.content) && (
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">
                      {activeCommentsPost.caption || activeCommentsPost.content}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsSheetPost(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-xl text-gray-300 transition hover:bg-white/[0.09] hover:text-white active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[48dvh] sm:max-h-[52vh] overflow-y-auto no-scrollbar px-3.5 py-3 sm:px-4 sm:py-4 space-y-2.5">
              {activeCommentsPost.comments && activeCommentsPost.comments.length > 0 ? (
                activeCommentsPost.comments.map((comment) => {
                  const canDeleteComment =
                    comment.user?._id === currentUserId || activeCommentsPost.user?._id === currentUserId;

                  return (
                    <div
                      key={comment._id}
                      className={`rounded-[22px] border p-3.5 transition-all ${
                        comment.isTemp
                          ? "border-pink-300/25 bg-pink-500/[0.07] opacity-85"
                          : "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          onClick={() => openUserProfile(comment.user?._id)}
                          src={
                            comment.user?.profilePic ||
                            "https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff"
                          }
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-white/10 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              onClick={() => openUserProfile(comment.user?._id)}
                              className="truncate text-sm font-black text-white cursor-pointer hover:text-pink-300"
                            >
                              {comment.user?.name || "User"}
                            </p>
                            {canDeleteComment && !comment.isTemp && (
                              <button
                                type="button"
                                onClick={() => deleteComment(activeCommentsPost._id, comment._id)}
                                className="shrink-0 rounded-full border border-red-400/15 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-200 transition hover:bg-red-500/18"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 break-words text-sm leading-relaxed text-gray-300">{comment.text}</p>
                          {comment.isTemp && (
                            <p className="mt-1 text-[10px] font-bold text-pink-200/70">Sending...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] text-2xl">💬</div>
                  <p className="font-black text-gray-200">No replies yet</p>
                  <p className="mt-1 text-sm">Be the first one to join this vybe.</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-zinc-950/95 p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText[activeCommentsPost._id] || ""}
                  onChange={(e) =>
                    setCommentText((prev) => ({
                      ...prev,
                      [activeCommentsPost._id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addComment(activeCommentsPost._id);
                  }}
                  placeholder="Drop a clean reply..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm outline-none transition focus:border-pink-400/45 focus:bg-white/[0.07]"
                />
                <button
                  type="button"
                  onClick={() => addComment(activeCommentsPost._id)}
                  className="rounded-2xl bg-gradient-to-r from-pink-500/85 via-purple-500/85 to-cyan-500/85 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/15 transition active:scale-95"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}

export default CommentsSheet;
