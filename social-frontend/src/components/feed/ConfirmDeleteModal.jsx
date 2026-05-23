import React from "react";

function ConfirmDeleteModal({ post, onCancel, onConfirm }) {
  if (!post) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/98 p-4 shadow-2xl shadow-black/70 animate-vybe-sheet"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />

        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-200">
            Delete Vybe
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            Remove this from your Flow?
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            This action will delete the vybe from your profile and feed. You
            can’t undo this later.
          </p>

          {(post.caption || post.content) && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="line-clamp-3 text-sm text-gray-300">
                {post.caption || post.content}
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onConfirm(post._id)}
              className="rounded-2xl border border-red-400/25 bg-red-500/20 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/30"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;