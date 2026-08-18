import React from "react";
import Avatar from "../ui/Avatar";

function LikesModal({ post, onClose }) {
  if (!post) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">
            Felt by ({post.likes?.length || 0})
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {post.likes && post.likes.length > 0 ? (
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {post.likes.map((user, index) => (
              <div
                key={user?._id || index}
                className="flex items-center gap-3 bg-white/[0.04] border border-white/5 rounded-2xl p-3"
              >
                <Avatar
                  src={user?.profilePic}
                  name={user?.name || "User"}
                  size="lg"
                  className="rounded-full"
                />

                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user?.name || "User"}
                  </p>

                  <p className="text-xs text-gray-400">Felt this vybe ❤️</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">
            No one felt this yet
          </p>
        )}
      </div>
    </div>
  );
}

export default LikesModal;