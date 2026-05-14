import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const isOwnProfile = !userId || userId === currentUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("images");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [listModal, setListModal] = useState(null); // followers | following
  const [listSearch, setListSearch] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [profilePicOpen, setProfilePicOpen] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [commentText, setCommentText] = useState("");

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const avatarUrl = (person) =>
    person?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person?.name || person?.username || "User"
    )}&background=8b5cf6&color=fff`;

  const imagePosts = posts.filter((post) => post.media?.[0]?.type === "image");
  const videoPosts = posts.filter((post) => post.media?.[0]?.type === "video");
  const thoughtPosts = posts.filter((post) => !post.media || post.media.length === 0);

  const fetchProfile = useCallback(async () => {
    try {
      const endpoint = isOwnProfile ? "/api/users/me" : `/api/users/${userId}`;
      const res = await API.get(endpoint, authConfig);

      setUser(res.data);
      setName(res.data.name || "");
      setUsername(res.data.username || "");
      setBio(res.data.bio || "");
      setPreviewPic(res.data.profilePic || "");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Profile load nahi ho payi");
    }
  }, [authConfig, isOwnProfile, userId]);

  const fetchPosts = useCallback(async () => {
    try {
      const endpoint = isOwnProfile ? "/api/posts/my-posts" : `/api/posts/user/${userId}`;
      const res = await API.get(endpoint, authConfig);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  }, [authConfig, isOwnProfile, userId]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const updatePostInState = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    setSelectedPost((prev) => (prev?._id === updatedPost._id ? updatedPost : prev));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Profile photo ke liye sirf image select karo");
      return;
    }

    setProfileFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return previewPic || user?.profilePic || "";

    const formData = new FormData();
    formData.append("file", profileFile);

    const res = await API.post("/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      setError("");

      const uploadedPic = await uploadProfileImage();

      const payload = {
        name,
        bio,
        profilePic: uploadedPic,
      };

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) {
        payload.username = cleanUsername;
      }

      const res = await API.put(
        "/api/users/me",
        payload,
        authConfig
      );

      localStorage.setItem("userName", res.data.name || "");
      localStorage.setItem("username", res.data.username || "");

      setUser(res.data);
      setProfileFile(null);
      setEdit(false);
    } catch (err) {
      setError(err.response?.data?.message || "Profile update nahi ho payi");
    } finally {
      setSaving(false);
    }
  };

  const followUser = async () => {
    try {
      const res = await API.put(`/api/users/follow/${user._id}`, {}, authConfig);
      setUser(res.data.user);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const likePost = async (postId) => {
    try {
      const res = await API.put(`/api/posts/like/${postId}`, {}, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const handleDoubleLike = (post) => {
    likePost(post._id);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 1000);
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
      const res = await API.delete(`/api/posts/comment/${postId}/${commentId}`, authConfig);
      updatePostInState(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const isFollowing = user?.followers?.some((f) => f._id === currentUserId);

  const activeList = listModal === "followers" ? user?.followers || [] : user?.following || [];
  const filteredList = activeList.filter((person) => {
    const q = listSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      person?.name?.toLowerCase().includes(q) ||
      person?.username?.toLowerCase().includes(q)
    );
  });

  const openUserProfile = (id) => {
    setListModal(null);
    setListSearch("");
    setSelectedPost(null);
    navigate(id === currentUserId ? "/profile" : `/profile/${id}`);
  };

  const renderUserRow = (person) => (
    <button
      key={person._id}
      onClick={() => openUserProfile(person._id)}
      className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 text-left hover:bg-white/10 transition-all"
    >
      <img src={avatarUrl(person)} alt="" className="w-12 h-12 rounded-full object-cover" />
      <div className="min-w-0">
        <h3 className="font-semibold truncate">{person.name || "User"}</h3>
        {person.username && <p className="text-sm text-gray-400 truncate">@{person.username}</p>}
      </div>
    </button>
  );

  const renderMediaCard = (post) => (
    <div
      key={post._id}
      onClick={() => setSelectedPost(post)}
      className="bg-zinc-950 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden group active:scale-[0.98] hover:scale-[1.02] hover:border-pink-400/40 transition-all duration-300 cursor-pointer shadow-xl"
    >
      {post.media[0].type === "image" ? (
        <img src={post.media[0].url} alt="" className="w-full aspect-square sm:h-[320px] object-cover" />
      ) : (
        <div className="relative">
          <video src={post.media[0].url} className="w-full aspect-square sm:h-[320px] object-cover" />
          <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-sm">🎬</div>
        </div>
      )}

      <div className="p-3 sm:p-4">
        <p className="text-gray-200 line-clamp-2 text-sm sm:text-base">{post.caption || post.content || "No caption"}</p>
        <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400">
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

  if (!user && !error) {
    return <div className="min-h-screen bg-black text-white p-6">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-3 sm:px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-zinc-950 border border-white/10 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="flex justify-center md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 blur-2xl opacity-40 rounded-full" />
                <button
                  type="button"
                  onClick={() => setProfilePicOpen(true)}
                  className="relative group rounded-full focus:outline-none focus:ring-4 focus:ring-pink-500/40"
                  title="View profile photo"
                >
                  <img
                    src={previewPic || avatarUrl(user)}
                    alt="Profile"
                    className="w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/10 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-pink-400/60"
                  />
                  <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/35 transition-all flex items-end justify-center pb-4 text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100">
                    View photo
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {edit ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                    />
                    <input
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                      }
                      placeholder="username"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                    />
                  </div>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    rows="4"
                    maxLength={160}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-4 resize-none"
                  />

                  <label className="block bg-white/5 border border-dashed border-white/20 rounded-2xl px-5 py-5 mb-5 cursor-pointer hover:bg-white/10">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    <span className="font-semibold">Upload profile photo</span>
                    <p className="text-sm text-gray-400 mt-1">
                      Image select karo, link paste karne ki zarurat nahi.
                    </p>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={updateProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 rounded-2xl font-semibold disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEdit(false);
                        setError("");
                        setPreviewPic(user?.profilePic || "");
                        setProfileFile(null);
                      }}
                      className="bg-white/10 px-6 py-3 rounded-2xl"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 text-center md:text-left">
                    <div className="min-w-0">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black break-words">
                        {user?.name || "User"}
                      </h1>
                      {user?.username && (
                        <p className="text-pink-300 mt-2 text-base sm:text-lg font-semibold break-words">
                          @{user.username}
                        </p>
                      )}
                      <p className="text-gray-400 mt-3 text-base sm:text-lg leading-relaxed max-w-2xl break-words">
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

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 mt-8 sm:mt-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center">
                      <h2 className="text-2xl sm:text-3xl font-black">{posts.length}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Posts</p>
                    </div>

                    <button
                      onClick={() => setListModal("followers")}
                      className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black">{user?.followers?.length || 0}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Followers</p>
                    </button>

                    <button
                      onClick={() => setListModal("following")}
                      className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-4 sm:py-5 text-center hover:bg-white/10 transition-all"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black">{user?.following?.length || 0}</h2>
                      <p className="text-gray-400 mt-1 text-xs sm:text-base">Following</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Profile Posts</h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                {imagePosts.length} posts • {videoPosts.length} reels • {thoughtPosts.length} thoughts
              </p>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-2xl p-1 grid grid-cols-3 sm:flex gap-1">
              {[
                ["images", "Posts"],
                ["videos", "Reels"],
                ["thoughts", "Thoughts"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                    activeTab === key
                      ? "bg-gradient-to-r from-pink-500 to-indigo-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "images" ? (
            imagePosts.length === 0 ? (
              <EmptyState text="No image posts yet ✨" />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {imagePosts.map(renderMediaCard)}
              </div>
            )
          ) : activeTab === "videos" ? (
            videoPosts.length === 0 ? (
              <EmptyState text="No reels/videos yet 🎬" />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {videoPosts.map(renderMediaCard)}
              </div>
            )
          ) : thoughtPosts.length === 0 ? (
            <EmptyState text="No thoughts yet ✨" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">{thoughtPosts.map(renderThoughtCard)}</div>
          )}
        </div>
      </div>


      {profilePicOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4"
          onClick={() => setProfilePicOpen(false)}
        >
          <button
            onClick={() => setProfilePicOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full text-xl"
          >
            ✕
          </button>
          <div className="w-full max-w-lg text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPic || avatarUrl(user)}
              alt="Profile large"
              className="w-full max-h-[78vh] object-contain rounded-[28px] border border-white/10 shadow-2xl"
            />
            <h3 className="mt-4 text-xl font-black">{user?.name || "User"}</h3>
            {user?.username && <p className="text-pink-300">@{user.username}</p>}
          </div>
        </div>
      )}

      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          user={user}
          currentUserId={currentUserId}
          avatarUrl={avatarUrl}
          animateLike={animateLike}
          handleDoubleLike={handleDoubleLike}
          likePost={likePost}
          commentText={commentText}
          setCommentText={setCommentText}
          addComment={addComment}
          deleteComment={deleteComment}
          setSelectedPost={setSelectedPost}
          openUserProfile={openUserProfile}
        />
      )}

      {listModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black capitalize">{listModal}</h2>
              <button
                onClick={() => {
                  setListModal(null);
                  setListSearch("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder={`Search ${listModal}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none mb-4"
            />

            <div className="space-y-3 overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <p className="text-gray-400 py-8 text-center">
                  {activeList.length === 0 ? `No ${listModal} yet` : "No user found"}
                </p>
              ) : (
                filteredList.map(renderUserRow)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-zinc-950 border border-white/10 rounded-3xl py-20 text-center text-gray-400">
      {text}
    </div>
  );
}

function PostModal({
  selectedPost,
  user,
  currentUserId,
  avatarUrl,
  animateLike,
  handleDoubleLike,
  likePost,
  commentText,
  setCommentText,
  addComment,
  deleteComment,
  setSelectedPost,
  openUserProfile,
}) {
  const liked = selectedPost.likes?.some((like) => like._id === currentUserId || like === currentUserId);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-t-[30px] sm:rounded-[32px] overflow-hidden relative h-[96vh] sm:h-auto sm:max-h-[92vh] shadow-2xl">
        <button
          onClick={() => setSelectedPost(null)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 bg-black/70 hover:bg-white/10 w-10 h-10 rounded-full"
        >
          ✕
        </button>

        <div className="grid lg:grid-cols-2 h-full">
          <div
            onDoubleClick={() => handleDoubleLike(selectedPost)}
            className="relative bg-black flex items-center justify-center h-[42vh] sm:min-h-[360px] lg:h-auto lg:min-h-[560px] lg:max-h-[85vh] cursor-pointer"
          >
            {animateLike && (
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <div className="text-[90px] md:text-[120px] animate-bounce drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]">
                  ❤️
                </div>
              </div>
            )}

            {selectedPost.media?.[0]?.type === "image" ? (
              <img src={selectedPost.media[0].url} alt="" className="w-full h-full lg:max-h-[85vh] object-contain" />
            ) : selectedPost.media?.[0]?.type === "video" ? (
              <video src={selectedPost.media[0].url} controls className="w-full h-full lg:max-h-[85vh] object-contain" />
            ) : (
              <div className="p-8 text-center text-gray-200 text-2xl sm:text-3xl font-bold leading-relaxed break-words">
                {selectedPost.caption || selectedPost.content}
              </div>
            )}
          </div>

          <div className="flex flex-col h-[54vh] lg:h-[85vh] min-h-0">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-zinc-950/95">
              <button onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}>
                <img src={avatarUrl(selectedPost.user || user)} alt="" className="w-12 h-12 rounded-full object-cover" />
              </button>
              <div className="min-w-0">
                <button
                  onClick={() => selectedPost.user?._id && openUserProfile(selectedPost.user._id)}
                  className="font-bold hover:underline truncate block"
                >
                  {selectedPost.user?.name || user?.name || "User"}
                </button>
                <p className="text-sm text-gray-400 truncate">
                  {selectedPost.user?.username ? `@${selectedPost.user.username} • ` : ""}
                  {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : ""}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
              {(selectedPost.caption || selectedPost.content) && (
                <p className="text-gray-200 leading-relaxed mb-6 break-words">
                  {selectedPost.caption || selectedPost.content}
                </p>
              )}

              <div className="space-y-4">
                {selectedPost.comments?.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No comments yet ✨</p>
                ) : (
                  selectedPost.comments?.map((comment) => {
                    const canDelete =
                      comment.user?._id === currentUserId || selectedPost.user?._id === currentUserId;

                    return (
                      <div key={comment._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => comment.user?._id && openUserProfile(comment.user._id)}>
                            <img src={avatarUrl(comment.user)} alt="" className="w-9 h-9 rounded-full object-cover" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <button
                                onClick={() => comment.user?._id && openUserProfile(comment.user._id)}
                                className="font-semibold text-sm hover:underline truncate"
                              >
                                {comment.user?.name || "User"}
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => deleteComment(selectedPost._id, comment._id)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            {comment.user?.username && (
                              <p className="text-xs text-gray-500">@{comment.user.username}</p>
                            )}
                            <p className="text-gray-300 text-sm mt-1 break-words">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-white/10 p-3 sm:p-5 bg-zinc-950/95">
              <div className="flex items-center gap-5 mb-4">
                <button
                  onClick={() => likePost(selectedPost._id)}
                  className="text-2xl hover:scale-110 transition-all"
                  title="Like/unlike"
                >
                  {liked ? "❤️" : "🤍"}
                </button>
                <span className="text-gray-300">{selectedPost.likes?.length || 0} likes</span>
                <span className="text-gray-300">💬 {selectedPost.comments?.length || 0}</span>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a comment..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 outline-none"
                />
                <button
                  onClick={addComment}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 sm:px-6 rounded-2xl font-semibold active:scale-95 transition-all"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">Double click media ya heart se like/unlike hoga.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
