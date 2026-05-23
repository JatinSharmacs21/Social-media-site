import React from "react";
import Avatar from "../ui/Avatar";

function ShareModal({
  post,
  copiedShare,
  getPostShareUrl,
  copyShareLink,
  nativeSharePost,
  onClose,
}) {
  if (!post) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-[fadeIn_0.2s_ease-in-out]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Share this vybe</h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              src={post.user?.profilePic}
              name={post.user?.name || "User"}
              size="lg"
              className="rounded-full"
            />

            <div>
              <p className="font-semibold text-white">
                {post.user?.name || "User"}
              </p>

              <p className="text-xs text-gray-500">Shared from Vybe Flow</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 line-clamp-2">
            {post.caption || post.content || "Vybeo vybe"}
          </p>

          <p className="text-xs text-gray-500 mt-2 truncate">
            {getPostShareUrl(post._id)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={copyShareLink}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-all font-medium"
          >
            {copiedShare ? "Copied ✅" : "Copy link"}
          </button>

          <button
            type="button"
            onClick={nativeSharePost}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-[1.02] transition-all font-medium"
          >
            Share Vybe
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;