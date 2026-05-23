import React from "react";

function RightSidebar({
  currentUser,
  currentUserId,
  navigate,
  suggestedUsers,
  isFollowingUser,
  openUserProfile,
  toggleFollowUser,
  trendingTags,
}) {
  return (
    <aside className="hidden lg:block w-full max-w-[320px]">
      <div className="sticky top-8 space-y-6">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <img
              onClick={() => navigate("/profile")}
              src={
                currentUser?.profilePic ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  currentUser?.name || "User"
                )}&background=8b5cf6&color=fff`
              }
              alt=""
              className="w-14 h-14 rounded-full object-cover border border-white/10 shadow-lg shadow-purple-500/20 cursor-pointer hover:scale-105 transition-all"
            />

            <div
              onClick={() => navigate("/profile")}
              className="min-w-0 cursor-pointer"
            >
              <h3 className="font-bold truncate hover:text-pink-300 transition-all">
                {currentUser?.name || "User"}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                @{currentUser?.username || currentUserId?.slice(-8) || "user"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold"
          >
            Vybe Space
          </button>
        </div>

        <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-200">People to Tune In</h3>
            <span className="text-xs text-gray-500">Fresh</span>
          </div>

          <div className="space-y-4">
            {suggestedUsers.map((user, index) => {
              const following = isFollowingUser(user);

              return (
                <div
                  key={user._id || index}
                  className="flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() =>
                      user._id && !user._id.startsWith("demo")
                        ? openUserProfile(user._id)
                        : null
                    }
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <img
                      src={
                        user.profilePic ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || "User"
                        )}&background=8b5cf6&color=fff`
                      }
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-white/10 hover:scale-105 transition-all"
                    />

                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate hover:text-pink-300 transition-all">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.bio || "People to Tune In"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFollowUser(user)}
                    className={`text-xs font-semibold transition-all ${
                      following
                        ? "text-gray-400 hover:text-red-300"
                        : "text-cyan-300 hover:text-cyan-200"
                    }`}
                  >
                    {following ? "Tuned In" : "Tune In"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
          <h3 className="font-bold text-gray-200 mb-4">Trending Vybes</h3>

          <div className="space-y-3">
            {trendingTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-sm text-gray-300 group-hover:text-cyan-300 transition-all">
                  {tag}
                </span>
                <span className="text-xs text-gray-600">trending</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600 leading-6 px-1">
          About · Help · Privacy · Terms <br />
          Vybeo © 2026
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
