import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [edit, setEdit] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [animateLike, setAnimateLike] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("images");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const isOwnProfile = !userId || userId === currentUserId;

  const authConfig = useMemo(
  () => ({
    headers: {
      Authorization: "Bearer " + token,
    },
  }),
  [token]
);

  const avatarUrl = (person) =>
    person?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person?.name || "User"
    )}&background=8b5cf6&color=fff`;

  const imagePosts = posts.filter(
  (post) => post.media?.[0]?.type === "image"
  );

  const videoPosts = posts.filter(
  (post) => post.media?.[0]?.type === "video"
  );

  const thoughtPosts = posts.filter(
  (post) => !post.media || post.media.length === 0
  );

  const fetchProfile = useCallback(async () => {
    try {
      const endpoint = isOwnProfile ? "/profile" : `/api/users/${userId}`;
      const res = await API.get(endpoint, authConfig);

      setUser(res.data);
      setName(res.data.name || "");
      setBio(res.data.bio || "");
    } catch (err) {
      console.log(err.response?.data || err);
    }
  }, [token, userId, isOwnProfile]);

  const fetchPosts = useCallback(async () => {
    try {
      const endpoint = isOwnProfile
        ? "/api/posts/my-posts"
        : `/api/posts/user/${userId}`;

      const res = await API.get(endpoint, authConfig);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  }, [token, userId, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const updatePostInState = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );

    setSelectedPost((prev) =>
      prev?._id === updatedPost._id ? updatedPost : prev
    );
  };

  const updateProfile = async () => {
    try {
      await API.put(
        "/profile",
        { name, bio },
        authConfig
      );

      setEdit(false);
      fetchProfile();
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const followUser = async () => {
    try {
      const res = await API.put(
        `/api/users/follow/${user._id}`,
        {},
        authConfig
      );

      setUser(res.data.user);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const updateProfilePic = async (url) => {
    if (!url) return;

    try {
      await API.put(
        "/profile",
        { profilePic: url },
        authConfig
      );

      fetchProfile();
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const likePost = async (postId) => {
    try {
      const res = await API.put(
        `/api/posts/like/${postId}`,
        {},
        authConfig
      );

      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const handleDoubleLike = (post) => {
    likePost(post._id);
    setAnimateLike(true);

    setTimeout(() => {
      setAnimateLike(false);
    }, 1200);
  };

  const addComment = async () => {
    try {
      if (!commentText.trim() || !selectedPost) return;

      const res = await API.post(
        `/api/posts/comment/${selectedPost._id}`,
        { text: commentText.trim() },
        authConfig
      );

      updatePostInState(res.data);
      setCommentText("");
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const res = await API.delete(
        `/api/posts/comment/${postId}/${commentId}`,
        authConfig
      );

      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const isFollowing = user?.followers?.some(
    (f) => f._id === currentUserId
  );

  const renderMediaCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer"
    >
      {post.media[0].type === "image" ? (
        <img
          src={post.media[0].url}
          alt=""
          className="w-full h-[320px] object-cover"
        />
      ) : (
        <div className="relative">
          <video
            src={post.media[0].url}
            className="w-full h-[320px] object-cover"
          />

          <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-sm">
            🎬
          </div>
        </div>
      )}

      <div className="p-4">
        <p className="text-gray-200 line-clamp-2">
          {post.caption || post.content || "No caption"}
        </p>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  );

  const renderThoughtCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 hover:border-pink-500/30 hover:bg-white/[0.03] transition-all cursor-pointer"
    >
      <p className="text-xl md:text-2xl font-semibold leading-relaxed text-white break-words">
        {post.caption || post.content || "Text Post"}
      </p>

      <div className="flex items-center justify-between mt-6 text-sm text-gray-400">
        <span>❤️ {post.likes?.length || 0}</span>
        <span>💬 {post.comments?.length || 0}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* TOP CARD */}
        <div className="bg-zinc-950 border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex justify-center md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 blur-2xl opacity-40 rounded-full" />

                <img
                  src={avatarUrl(user)}
                  alt=""
                  className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/10"
                />
              </div>
            </div>

            <div className="flex-1">
              {edit ? (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-4"
                  />

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    rows="4"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-4 resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Profile image URL"
                    onBlur={(e) => updateProfilePic(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-5"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={updateProfile}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 rounded-2xl font-semibold"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEdit(false)}
                      className="bg-white/10 px-6 py-3 rounded-2xl"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                      <h1 className="text-4xl md:text-5xl font-black">
                        {user?.name}
                      </h1>

                      <p className="text-gray-400 mt-3 text-lg leading-relaxed max-w-2xl">
                        {user?.bio || "No bio yet"}
                      </p>
                    </div>

                    {isOwnProfile ? (
                      <button
                        onClick={() => setEdit(true)}
                        className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-semibold"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={followUser}
                        className={`px-7 py-3 rounded-2xl font-semibold transition-all ${
                          isFollowing
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg hover:scale-105"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 md:gap-8 mt-10 flex-wrap">
                    <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 min-w-[120px]">
                      <h2 className="text-3xl font-black">{posts.length}</h2>
                      <p className="text-gray-400 mt-1">Posts</p>
                    </div>

                    <button
                      onClick={() => setShowFollowers(true)}
                      className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 min-w-[120px] text-left hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-3xl font-black">
                        {user?.followers?.length || 0}
                      </h2>
                      <p className="text-gray-400 mt-1">Followers</p>
                    </button>

                    <button
                      onClick={() => setShowFollowing(true)}
                      className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 min-w-[120px] text-left hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-3xl font-black">
                        {user?.following?.length || 0}
                      </h2>
                      <p className="text-gray-400 mt-1">Following</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* POSTS */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-black">Profile Posts</h2>
              <p className="text-gray-400 mt-1">
                {imagePosts.length} posts • {videoPosts.length} reels • {thoughtPosts.length} thoughts
              </p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-1 flex flex-wrap gap-1">
  <button
    onClick={() => setActiveTab("images")}
    className={`px-5 py-3 rounded-xl font-semibold transition-all ${
      activeTab === "images"
        ? "bg-gradient-to-r from-pink-500 to-indigo-500"
        : "text-gray-400 hover:text-white"
    }`}
  >
    Posts
  </button>

  <button
    onClick={() => setActiveTab("videos")}
    className={`px-5 py-3 rounded-xl font-semibold transition-all ${
      activeTab === "videos"
        ? "bg-gradient-to-r from-pink-500 to-indigo-500"
        : "text-gray-400 hover:text-white"
    }`}
  >
    Reels
  </button>

  <button
    onClick={() => setActiveTab("thoughts")}
    className={`px-5 py-3 rounded-xl font-semibold transition-all ${
      activeTab === "thoughts"
        ? "bg-gradient-to-r from-pink-500 to-indigo-500"
        : "text-gray-400 hover:text-white"
    }`}
  >
    Thoughts
  </button>
</div>
          </div>

          {activeTab === "images" ? (
            imagePosts.length === 0 ? (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl py-20 text-center text-gray-400">
            No image posts yet ✨
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {imagePosts.map(renderMediaCard)}
          </div>
        )
      ) : activeTab === "videos" ? (
            videoPosts.length === 0 ? (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl py-20 text-center text-gray-400">
            No reels/videos yet 🎬
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videoPosts.map(renderMediaCard)}
          </div>
      )
    ) : thoughtPosts.length === 0 ? (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl py-20 text-center text-gray-400">
            No thoughts yet ✨
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {thoughtPosts.map(renderThoughtCard)}
      </div>
    )}
        </div>
      </div>

      {/* POST MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden relative">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-5 right-5 z-50 bg-black/60 hover:bg-white/10 w-10 h-10 rounded-full"
            >
              ✕
            </button>

            <div className="grid lg:grid-cols-2">
              <div
                onDoubleClick={() => handleDoubleLike(selectedPost)}
                className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[85vh] cursor-pointer"
              >
                {animateLike && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="absolute w-32 h-32 bg-pink-500/15 rounded-full blur-2xl" />

                    <div className="text-[90px] md:text-[120px] animate-[heartPremium_1.2s_cubic-bezier(0.22,1,0.36,1)_forwards] drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]">
                      ❤️
                    </div>
                  </div>
                )}

                {selectedPost.media?.[0]?.type === "image" ? (
                  <img
                    src={selectedPost.media[0].url}
                    alt=""
                    className="w-full max-h-[85vh] object-contain"
                  />
                ) : selectedPost.media?.[0]?.type === "video" ? (
                  <video
                    src={selectedPost.media[0].url}
                    controls
                    className="w-full max-h-[85vh] object-contain"
                  />
                ) : (
                  <div className="p-10 text-center text-gray-200 text-3xl font-bold leading-relaxed">
                    {selectedPost.caption || selectedPost.content}
                  </div>
                )}
              </div>

              <div className="flex flex-col h-[85vh]">
                <div className="p-5 border-b border-white/10 flex items-center gap-3">
                  <img
                    src={avatarUrl(selectedPost.user)}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div>
                    <h3 className="font-bold">
                      {selectedPost.user?.name || user?.name}
                    </h3>

                    <p className="text-sm text-gray-400">
                      {selectedPost.createdAt
                        ? new Date(selectedPost.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {(selectedPost.caption || selectedPost.content) && (
                    <p className="text-gray-200 leading-relaxed mb-6">
                      {selectedPost.caption || selectedPost.content}
                    </p>
                  )}

                  <div className="space-y-4">
                    {selectedPost.comments?.length === 0 ? (
                      <p className="text-gray-500 text-center py-10">
                        No comments yet ✨
                      </p>
                    ) : (
                      selectedPost.comments?.map((comment) => {
                        const canDelete =
                          comment.user?._id === currentUserId ||
                          selectedPost.user?._id === currentUserId;

                        return (
                          <div
                            key={comment._id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={avatarUrl(comment.user)}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="font-semibold text-sm">
                                    {comment.user?.name || "User"}
                                  </h4>

                                  {canDelete && (
                                    <button
                                      onClick={() =>
                                        deleteComment(
                                          selectedPost._id,
                                          comment._id
                                        )
                                      }
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>

                                <p className="text-gray-300 text-sm mt-1 break-words">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 p-5">
                  <div className="flex items-center gap-5 mb-4">
                    <button
                      onDoubleClick={() => handleDoubleLike(selectedPost)}
                      className="text-2xl hover:scale-110 transition-all"
                      title="Double click to like/unlike"
                    >
                      ❤️
                    </button>

                    <span className="text-gray-300">
                      {selectedPost.likes?.length || 0} likes
                    </span>

                    <span className="text-gray-300">
                      💬 {selectedPost.comments?.length || 0}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                    />

                    <button
                      onClick={addComment}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 rounded-2xl font-semibold"
                    >
                      Send
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Double click media or heart to like/unlike.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOWERS MODAL */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Followers</h2>

              <button
                onClick={() => setShowFollowers(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {user?.followers?.length === 0 ? (
                <p className="text-gray-400">No followers yet</p>
              ) : (
                user?.followers?.map((follower) => (
                  <div
                    key={follower._id}
                    onClick={() => {
                      navigate(`/profile/${follower._id}`);
                      setShowFollowers(false);
                    }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/10"
                  >
                    <img
                      src={avatarUrl(follower)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    <h3 className="font-semibold">{follower.name}</h3>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOLLOWING MODAL */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Following</h2>

              <button
                onClick={() => setShowFollowing(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {user?.following?.length === 0 ? (
                <p className="text-gray-400">Not following anyone</p>
              ) : (
                user?.following?.map((following) => (
                  <div
                    key={following._id}
                    onClick={() => {
                      navigate(`/profile/${following._id}`);
                      setShowFollowing(false);
                    }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/10"
                  >
                    <img
                      src={avatarUrl(following)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    <h3 className="font-semibold">{following.name}</h3>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;